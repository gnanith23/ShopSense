// ==================== SQL ANALYTICS & TEXT-TO-SQL SERVICE ====================
// Provides safe, read-only analytical SQL execution on top of synchronized
// MongoDB e-commerce data with strict vendor isolation and safety validation.

const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const axios = require("axios");

const Vendor = require("../models/Vendor");
const Product = require("../models/Product");
const Transaction = require("../models/Transaction");

const DATA_DIR = path.join(__dirname, "..", "data");
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, "analytics.db");
const db = new sqlite3.Database(DB_PATH);

const PREFERRED_MODELS = [
    "google/gemini-2.0-flash-exp:free",
    "meta-llama/llama-3.1-8b-instruct:free",
    "openai/gpt-oss-20b:free",
    "openrouter/auto"
];

// Initialize Tables
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS vendors (
            id TEXT PRIMARY KEY,
            business_name TEXT,
            name TEXT,
            email TEXT
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS products (
            id TEXT PRIMARY KEY,
            vendor_id TEXT,
            name TEXT,
            category TEXT,
            price REAL,
            stock INTEGER,
            FOREIGN KEY (vendor_id) REFERENCES vendors(id)
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS transactions (
            id TEXT PRIMARY KEY,
            vendor_id TEXT,
            customer_id TEXT,
            product_id TEXT,
            quantity INTEGER,
            unit_price REAL,
            total_amount REAL,
            status TEXT,
            date TEXT,
            created_at TEXT,
            FOREIGN KEY (vendor_id) REFERENCES vendors(id),
            FOREIGN KEY (product_id) REFERENCES products(id)
        )
    `);
});

/**
 * Synchronizes latest MongoDB records into the SQLite analytics database.
 */
async function syncMongoToSQLite() {
    try {
        const vendors = await Vendor.find();
        const products = await Product.find();
        const transactions = await Transaction.find({ status: "COMPLETED" });

        return new Promise((resolve, reject) => {
            db.serialize(() => {
                db.run("BEGIN TRANSACTION");

                const stmtVendor = db.prepare(`
                    INSERT OR REPLACE INTO vendors (id, business_name, name, email)
                    VALUES (?, ?, ?, ?)
                `);
                vendors.forEach(v => {
                    stmtVendor.run(v._id.toString(), v.businessName || "", v.name || "", v.email || "");
                });
                stmtVendor.finalize();

                const stmtProd = db.prepare(`
                    INSERT OR REPLACE INTO products (id, vendor_id, name, category, price, stock)
                    VALUES (?, ?, ?, ?, ?, ?)
                `);
                products.forEach(p => {
                    stmtProd.run(p._id.toString(), p.vendor?.toString() || "", p.name || "", p.category || "", p.price || 0, p.stock || 0);
                });
                stmtProd.finalize();

                const stmtTx = db.prepare(`
                    INSERT OR REPLACE INTO transactions (id, vendor_id, customer_id, product_id, quantity, unit_price, total_amount, status, date, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `);
                transactions.forEach(t => {
                    const dateStr = t.createdAt ? new Date(t.createdAt).toISOString().split("T")[0] : "";
                    const createdIso = t.createdAt ? new Date(t.createdAt).toISOString() : "";
                    stmtTx.run(
                        t._id.toString(),
                        t.vendor?.toString() || "",
                        t.customer?.toString() || "",
                        t.product?.toString() || "",
                        t.quantity || 1,
                        t.unitPrice || 0,
                        t.totalAmount || 0,
                        t.status || "COMPLETED",
                        dateStr,
                        createdIso
                    );
                });
                stmtTx.finalize();

                db.run("COMMIT", (err) => {
                    if (err) reject(err);
                    else resolve(true);
                });
            });
        });
    } catch (err) {
        console.error("Failed to sync MongoDB to SQLite:", err.message);
        throw err;
    }
}

/**
 * Validates SQL query for strict safety:
 * 1. Must be single SELECT or WITH statement.
 * 2. Rejects destructive operations.
 * 3. Enforces vendor isolation.
 */
function validateAndSanitizeSQL(rawSQL, vendorId) {
    if (!rawSQL || typeof rawSQL !== "string") {
        throw new Error("Invalid SQL: Query must be a non-empty string");
    }

    let cleaned = rawSQL.trim().replace(/^```sql/i, "").replace(/^```/i, "").replace(/```$/i, "").trim();

    // Disallow semicolons that chain multiple queries
    if (cleaned.includes(";")) {
        const parts = cleaned.split(";").map(s => s.trim()).filter(Boolean);
        if (parts.length > 1) {
            throw new Error("Security Violation: Multiple SQL statements are not permitted");
        }
        cleaned = parts[0];
    }

    // Must start with SELECT or WITH
    if (!/^(SELECT|WITH)\b/i.test(cleaned)) {
        throw new Error("Security Violation: Only read-only SELECT queries are allowed");
    }

    // Reject destructive and administrative keywords
    const forbiddenPattern = /\b(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|CREATE|GRANT|REVOKE|EXEC|EXECUTE|PRAGMA|ATTACH|DETACH|REINDEX|VACUUM|REPLACE|INTO|UPDATEXML)\b/i;
    if (forbiddenPattern.test(cleaned)) {
        throw new Error("Security Violation: Destructive or non-SELECT operations are strictly prohibited");
    }

    // Ensure Vendor Data Isolation:
    // If the query does not contain vendor_id filter, wrap it inside a vendor-scoped filter
    const vendorIdStr = vendorId.toString();
    const hasVendorFilter = cleaned.includes(vendorIdStr);

    if (!hasVendorFilter) {
        // Enforce vendor isolation by wrapping query or injecting vendor filter
        if (/FROM\s+transactions\b/i.test(cleaned) && !/WHERE\b/i.test(cleaned)) {
            cleaned = cleaned.replace(/FROM\s+transactions\b/i, `FROM transactions WHERE vendor_id = '${vendorIdStr}'`);
        } else if (/FROM\s+transactions\b/i.test(cleaned) && /WHERE\b/i.test(cleaned)) {
            cleaned = cleaned.replace(/WHERE\b/i, `WHERE vendor_id = '${vendorIdStr}' AND `);
        } else {
            // Safe fallback wrapping
            cleaned = `SELECT * FROM (${cleaned}) WHERE vendor_id = '${vendorIdStr}'`;
        }
    }

    return cleaned;
}

/**
 * Executes a sanitized, validated SQL query against the SQLite database.
 */
function executeSQL(sqlQuery) {
    return new Promise((resolve, reject) => {
        db.all(sqlQuery, [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
        });
    });
}

/**
 * Fallback SQL generator for common analytics questions.
 */
function generateFallbackSQL(prompt, vendorId) {
    const p = prompt.toLowerCase();
    const vId = vendorId.toString();

    if (p.includes("drop") || p.includes("last week") || p.includes("trend") || p.includes("daily")) {
        return `SELECT date, SUM(total_amount) AS daily_revenue, SUM(quantity) AS units_sold, COUNT(id) AS transaction_count FROM transactions WHERE vendor_id = '${vId}' GROUP BY date ORDER BY date DESC LIMIT 14`;
    }
    if (p.includes("product") || p.includes("most revenue") || p.includes("best selling") || p.includes("top")) {
        return `SELECT p.name AS product_name, p.category, SUM(t.total_amount) AS total_revenue, SUM(t.quantity) AS units_sold FROM transactions t JOIN products p ON t.product_id = p.id WHERE t.vendor_id = '${vId}' GROUP BY t.product_id ORDER BY total_revenue DESC LIMIT 5`;
    }
    if (p.includes("category")) {
        return `SELECT p.category, SUM(t.total_amount) AS total_revenue, SUM(t.quantity) AS units_sold, COUNT(t.id) AS orders FROM transactions t JOIN products p ON t.product_id = p.id WHERE t.vendor_id = '${vId}' GROUP BY p.category ORDER BY total_revenue DESC`;
    }
    // Default summary
    return `SELECT SUM(total_amount) AS total_revenue, SUM(quantity) AS total_units_sold, COUNT(id) AS total_transactions, ROUND(AVG(total_amount), 2) AS avg_order_value FROM transactions WHERE vendor_id = '${vId}'`;
}

/**
 * Runs Text-to-SQL pipeline for Vendor AI Data Analyst.
 * 
 * @param {string} question - Vendor's natural language question
 * @param {string} vendorId - Authenticated vendor ID
 * @returns {Promise<{query: string, results: Array, explanation: string}>}
 */
async function processVendorAnalystQuery(question, vendorId) {
    if (!question || typeof question !== "string" || !question.trim()) {
        throw new Error("Question is required for AI Data Analyst");
    }

    // Sync latest MongoDB data into SQLite
    await syncMongoToSQLite();

    const cleanQuestion = question.trim();
    const vendorIdStr = vendorId.toString();

    const schemaDescription = `
SQLite Database Schema:
- vendors (id TEXT, business_name TEXT, name TEXT, email TEXT)
- products (id TEXT, vendor_id TEXT, name TEXT, category TEXT, price REAL, stock INTEGER)
- transactions (id TEXT, vendor_id TEXT, customer_id TEXT, product_id TEXT, quantity INTEGER, unit_price REAL, total_amount REAL, status TEXT, date TEXT, created_at TEXT)

Important:
- Current vendor_id = '${vendorIdStr}'
- All transactions are completed sales.
- Columns like date are in format 'YYYY-MM-DD'.
- Use JOIN on transactions.product_id = products.id when product names or categories are required.
- You MUST only write a single SELECT query.
- You MUST filter by vendor_id = '${vendorIdStr}'.
`;

    let generatedSQL = "";
    const apiKey = process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY;

    if (apiKey) {
        const sqlPrompt = `
You are an expert Data Analyst and SQL Engineer for ShopSense e-commerce platform.
Convert the vendor's question into a precise, efficient SQLite SELECT query.

${schemaDescription}

Vendor Question: "${cleanQuestion}"

Return ONLY the raw SQL query. Do not wrap in markdown or backticks. No comments.`;

        for (const model of PREFERRED_MODELS) {
            try {
                const response = await axios.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    {
                        model,
                        messages: [
                            { role: "system", content: "You output only valid, executable SQLite SELECT queries." },
                            { role: "user", content: sqlPrompt }
                        ],
                        temperature: 0.1
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${apiKey}`,
                            "Content-Type": "application/json"
                        },
                        timeout: 7000
                    }
                );

                const sqlText = response.data?.choices?.[0]?.message?.content;
                if (sqlText && sqlText.trim()) {
                    generatedSQL = sqlText.trim();
                    break;
                }
            } catch (err) {
                console.warn(`[AI Analyst] SQL generation with ${model} failed: ${err.message}`);
            }
        }
    }

    if (!generatedSQL) {
        generatedSQL = generateFallbackSQL(cleanQuestion, vendorIdStr);
    }

    // Safety validation and vendor isolation enforcement
    const validatedSQL = validateAndSanitizeSQL(generatedSQL, vendorIdStr);

    // Execute SQL query
    let results = [];
    try {
        results = await executeSQL(validatedSQL);
    } catch (sqlExecErr) {
        console.warn(`[AI Analyst] SQL execution failed (${sqlExecErr.message}). Retrying with fallback SQL.`);
        const fallbackSQL = generateFallbackSQL(cleanQuestion, vendorIdStr);
        results = await executeSQL(fallbackSQL);
        generatedSQL = fallbackSQL;
    }

    // Generate analytical explanation of the results
    let explanation = "";
    if (apiKey && results.length > 0) {
        const explainPrompt = `
You are a business intelligence data analyst for a vendor on ShopSense.
Vendor Question: "${cleanQuestion}"
SQL Query Executed: \`${validatedSQL}\`
Query Results (JSON):
${JSON.stringify(results.slice(0, 10), null, 2)}

Provide a concise, 2-3 sentence clear business insight and direct answer to the vendor based on these exact numbers. Be helpful, professional, and highlight key takeaways.`;

        for (const model of PREFERRED_MODELS) {
            try {
                const res = await axios.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    {
                        model,
                        messages: [
                            { role: "system", content: "You provide actionable business insights from query results." },
                            { role: "user", content: explainPrompt }
                        ],
                        temperature: 0.3
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${apiKey}`,
                            "Content-Type": "application/json"
                        },
                        timeout: 7000
                    }
                );
                const text = res.data?.choices?.[0]?.message?.content;
                if (text && text.trim()) {
                    explanation = text.trim();
                    break;
                }
            } catch (e) {
                console.warn(`[AI Analyst] Explanation generation failed with ${model}: ${e.message}`);
            }
        }
    }

    if (!explanation) {
        if (results.length === 0) {
            explanation = "The query returned no matching sales records for your account under the specified parameters.";
        } else {
            const firstRow = results[0];
            const keys = Object.keys(firstRow);
            const summaryParts = keys.map(k => `${k}: ${firstRow[k]}`).join(", ");
            explanation = `Based on your sales data, here is the breakdown (${results.length} record(s) found): ${summaryParts}.`;
        }
    }

    return {
        success: true,
        question: cleanQuestion,
        query: validatedSQL,
        results,
        recordCount: results.length,
        explanation
    };
}

module.exports = {
    syncMongoToSQLite,
    validateAndSanitizeSQL,
    executeSQL,
    processVendorAnalystQuery
};

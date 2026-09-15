/**
 * ShopSense - Weekly Autonomous Agent Scheduler
 * =============================================
 * Schedules the AI Vendor Analysis Agent to run autonomously once per week.
 * 
 * Safety & Reliability:
 * - Runs asynchronously in background: never blocks the Express event loop.
 * - Prevents duplicate initialization using an idempotent initialization guard.
 * - Logs start and completion timestamps cleanly.
 */

const cron = require("node-cron");
const { runWeeklyVendorAgent } = require("./aiAgentService");

let isInitialized = false;
let weeklyTask = null;

/**
 * Initializes the weekly cron schedule.
 * Defaults to every Monday at 09:00 AM ('0 9 * * 1').
 */
function initAgentScheduler() {
    if (isInitialized) {
        console.log("[Scheduler] Agent scheduler already initialized. Skipping duplicate setup.");
        return;
    }

    // Cron expression: At 09:00 on Monday (once per week)
    const cronExpression = process.env.AI_AGENT_CRON || "0 9 * * 1";

    try {
        weeklyTask = cron.schedule(cronExpression, async () => {
            console.log(`[Scheduler] Triggering scheduled weekly vendor analysis (${new Date().toISOString()})...`);
            try {
                await runWeeklyVendorAgent();
            } catch (err) {
                console.error("[Scheduler] Error running scheduled weekly analysis:", err.message);
            }
        });

        isInitialized = true;
        console.log(`[Scheduler] Weekly AI Agent scheduler initialized successfully. Schedule: "${cronExpression}"`);
    } catch (err) {
        console.error("[Scheduler] Failed to initialize cron scheduler:", err.message);
    }
}

/**
 * Stop scheduler (useful for graceful shutdown or tests).
 */
function stopAgentScheduler() {
    if (weeklyTask) {
        weeklyTask.stop();
        weeklyTask = null;
    }
    isInitialized = false;
}

module.exports = {
    initAgentScheduler,
    stopAgentScheduler
};

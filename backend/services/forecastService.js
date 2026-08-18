// ==================== TIME-SERIES FORECASTING SERVICE ====================

const ARIMA = require("arima");

// =========================================================================
// ==================== TIME-SERIES PREPARATION ============================
// =========================================================================
//
// Converts raw COMPLETED transactions into a continuous daily time series.
// Fills missing calendar dates between first and last transaction with 0 demand.

function buildContinuousTimeSeries(transactions) {

    if (!transactions || transactions.length === 0) {
        return [];
    }


    // Step 1: Map transactions by YYYY-MM-DD
    const salesByDate = {};

    transactions.forEach((tx) => {
        const dateStr = new Date(tx.createdAt).toISOString().split("T")[0];
        salesByDate[dateStr] = (salesByDate[dateStr] || 0) + (tx.quantity || 0);
    });

    const dates = Object.keys(salesByDate).sort();

    if (dates.length === 0) {
        return [];
    }


    // Step 2: Fill intermediate missing dates to ensure contiguous time series
    const startDate = new Date(dates[0]);
    const endDate = new Date(dates[dates.length - 1]);

    // Ensure at least a 7-day span if start and end are on the same day
    const minSpanMs = 6 * 24 * 60 * 60 * 1000;
    if (endDate.getTime() - startDate.getTime() < minSpanMs) {
        endDate.setTime(startDate.getTime() + minSpanMs);
    }

    const series = [];
    const curr = new Date(startDate);

    while (curr <= endDate) {
        const dStr = curr.toISOString().split("T")[0];
        series.push({
            date: dStr,
            quantity: salesByDate[dStr] || 0
        });
        curr.setDate(curr.getDate() + 1);
    }

    return series;
}


// =========================================================================
// ==================== HOLT'S LINEAR EXPONENTIAL SMOOTHING =================
// =========================================================================
//
// Statistical time-series model used as ARIMA fallback or for shorter series.
// Level: L_t = alpha * y_t + (1 - alpha) * (L_{t-1} + T_{t-1})
// Trend: T_t = beta * (L_t - L_{t-1}) + (1 - beta) * T_{t-1}
// Forecast: F_{t+h} = L_t + h * T_t

function holtLinearForecast(values, horizon, alpha = 0.3, beta = 0.1) {

    if (values.length < 2) {
        const lastVal = values[0] || 0;
        return Array(horizon).fill(lastVal);
    }

    let level = values[0];
    let trend = values[1] - values[0];

    for (let i = 1; i < values.length; i++) {
        const prevLevel = level;
        const y = values[i];
        level = alpha * y + (1 - alpha) * (prevLevel + trend);
        trend = beta * (level - prevLevel) + (1 - beta) * trend;
    }

    const forecast = [];
    for (let h = 1; h <= horizon; h++) {
        const predicted = level + h * trend;
        forecast.push(Math.max(0, Math.round(predicted)));
    }

    return forecast;
}


// =========================================================================
// ==================== ARIMA TIME-SERIES MODEL ============================
// =========================================================================

function generateArimaForecast(values, horizon) {

    // For shorter series (< 10 points), use Holt's Linear Exponential Smoothing directly
    if (values.length < 10) {
        const forecast = holtLinearForecast(values, horizon);
        return {
            forecast,
            modelName: "Holt-Linear Exponential Smoothing (Time-Series)"
        };
    }

    try {
        const p = 1;
        const d = 1;
        const q = 0;

        const arima = new ARIMA({ p, d, q, verbose: false }).fit(values);
        const [predictions] = arima.predict(horizon);

        const sanitized = predictions.map((val) => {
            if (Number.isNaN(val) || !Number.isFinite(val)) {
                return 0;
            }
            return Math.max(0, Math.round(val));
        });

        return {
            forecast: sanitized,
            modelName: `ARIMA(${p},${d},${q})`
        };

    } catch (err) {
        const fallbackForecast = holtLinearForecast(values, horizon);
        return {
            forecast: fallbackForecast,
            modelName: "Holt-Linear Exponential Smoothing (Fallback)"
        };
    }
}


// =========================================================================
// ==================== BACKTESTING / MODEL VALIDATION =====================
// =========================================================================
//
// Calculates Mean Absolute Error (MAE) and Root Mean Squared Error (RMSE)
// by training on the first 70% of data and testing on the remaining 30%.

function runBacktest(values) {

    if (!values || values.length < 7) {
        return {
            status: "INSUFFICIENT_DATA_FOR_BACKTEST",
            explanation: "Requires at least 7 daily observations to perform backtesting"
        };
    }

    const trainSize = Math.floor(values.length * 0.7);
    const testSize = values.length - trainSize;

    if (trainSize < 4 || testSize < 2) {
        return {
            status: "INSUFFICIENT_DATA_FOR_BACKTEST",
            explanation: "Data split insufficient for train/test evaluation"
        };
    }

    const trainValues = values.slice(0, trainSize);
    const testValues = values.slice(trainSize);

    // Generate forecast for test horizon
    const { forecast: testPredictions } = generateArimaForecast(trainValues, testSize);

    // Compute MAE and RMSE
    let absoluteErrorSum = 0;
    let squaredErrorSum = 0;

    for (let i = 0; i < testSize; i++) {
        const actual = testValues[i];
        const pred = testPredictions[i] || 0;
        const err = actual - pred;

        absoluteErrorSum += Math.abs(err);
        squaredErrorSum += err * err;
    }

    const mae = Math.round((absoluteErrorSum / testSize) * 100) / 100;
    const rmse = Math.round(Math.sqrt(squaredErrorSum / testSize) * 100) / 100;

    return {
        status: "EVALUATED",
        trainObservations: trainSize,
        testObservations: testSize,
        metrics: {
            mae,
            rmse
        },
        explanation: `Model evaluated on ${testSize} test observations. MAE = ${mae}, RMSE = ${rmse}`
    };
}


// =========================================================================
// ==================== MAIN FORECAST FUNCTION =============================
// =========================================================================

const MINIMUM_OBSERVATIONS = 5;

function forecastProductDemand({ product, transactions, horizon = 7 }) {

    // Step 1: Build continuous daily time series
    const series = buildContinuousTimeSeries(transactions);
    const availableObservations = series.length;
    const totalHistoricalUnits = series.reduce((sum, item) => sum + item.quantity, 0);


    // Step 2: Check minimum data requirement
    if (availableObservations < MINIMUM_OBSERVATIONS || totalHistoricalUnits === 0) {

        return {
            success: false,
            status: "INSUFFICIENT_DATA",
            message: "Not enough historical sales data to generate a reliable forecast.",
            requiredMinimum: MINIMUM_OBSERVATIONS,
            availableObservations,
            totalHistoricalUnits,
            product: {
                id: product._id,
                name: product.name,
                category: product.category,
                currentStock: product.stock
            }
        };
    }


    // Step 3: Extract time-series values
    const historicalValues = series.map((d) => d.quantity);


    // Step 4: Run forecasting model
    const { forecast: predictedDailyValues, modelName } = generateArimaForecast(
        historicalValues,
        horizon
    );


    // Step 5: Format daily forecast with future dates
    const lastDate = new Date(series[series.length - 1].date);
    const dailyForecast = [];

    for (let i = 0; i < horizon; i++) {
        const nextDate = new Date(lastDate);
        nextDate.setDate(lastDate.getDate() + i + 1);

        dailyForecast.push({
            date: nextDate.toISOString().split("T")[0],
            predictedDemand: predictedDailyValues[i] || 0
        });
    }


    // Step 6: Compute demand aggregates & safety stock
    const totalPredictedDemand = predictedDailyValues.reduce((a, b) => a + b, 0);
    const averageDailyDemand = Math.round((totalPredictedDemand / horizon) * 100) / 100;

    // 10% safety buffer
    const safetyBufferUnits = Math.ceil(totalPredictedDemand * 0.10);
    const requiredTotalStock = totalPredictedDemand + safetyBufferUnits;
    const currentStock = product.stock || 0;

    const shortage = Math.max(0, requiredTotalStock - currentStock);
    const recommended = shortage > 0;
    const recommendedQuantity = shortage;


    // Step 7: Backtest model accuracy if enough data points exist
    const validation = runBacktest(historicalValues);


    // Step 8: Construct clean JSON response
    return {
        success: true,
        status: "SUCCESS",
        product: {
            id: product._id,
            name: product.name,
            category: product.category,
            currentStock
        },
        forecast: {
            horizonDays: horizon,
            totalPredictedDemand,
            averageDailyDemand,
            safetyBufferUnits,
            requiredTotalStock
        },
        restock: {
            recommended,
            recommendedQuantity,
            explanation: recommended
                ? `Predicted demand (${totalPredictedDemand}) + safety buffer (${safetyBufferUnits}) exceeds current stock (${currentStock}). Consider restocking ${recommendedQuantity} units.`
                : `Current stock (${currentStock}) is sufficient to cover predicted demand (${totalPredictedDemand}) + safety buffer (${safetyBufferUnits}) for the next ${horizon} days.`
        },
        dailyForecast,
        historicalSummary: {
            availableObservations,
            totalHistoricalUnits,
            startDate: series[0].date,
            endDate: series[series.length - 1].date
        },
        model: {
            name: modelName,
            type: "Time-Series Forecasting",
            basis: "Historical completed sales transactions — zero external AI calls"
        },
        validation
    };
}


// ==================== EXPORT SERVICE ====================

module.exports = {
    forecastProductDemand,
    buildContinuousTimeSeries
};

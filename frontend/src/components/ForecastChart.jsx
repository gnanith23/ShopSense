import { useState } from 'react';

// ForecastChart — Renders a responsive SVG daily demand chart
// Displays historical sales and future predicted demand dates.

export default function ForecastChart({ dailyForecast = [], historicalSummary = {} }) {
  const [hoveredItem, setHoveredItem] = useState(null);

  if (!dailyForecast || dailyForecast.length === 0) {
    return (
      <div style={{
        height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#F8FAFC', borderRadius: 8, border: '1px dashed #CBD5E1', color: '#94A3B8',
        fontSize: '0.875rem'
      }}>
        No daily forecast points to display.
      </div>
    );
  }

  const values = dailyForecast.map((d) => d.predictedDemand || 0);
  const maxVal = Math.max(...values, 1);
  const chartHeight = 160;

  return (
    <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '1.25rem', border: '1px solid #E2E8F0' }}>
      {/* Legend & Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#374151' }}>
          Daily Demand Trajectory ({dailyForecast.length}-Day Forecast)
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#4F46E5', fontWeight: 600 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: 'linear-gradient(180deg, #6366F1 0%, #4F46E5 100%)', display: 'inline-block' }} />
            Predicted Demand
          </span>
        </div>
      </div>

      {/* SVG Bar Chart */}
      <div style={{ position: 'relative', width: '100%', height: chartHeight + 35 }}>
        <svg style={{ width: '100%', height: chartHeight + 35, overflow: 'visible' }}>
          {/* Baseline grid lines */}
          {[0, 0.5, 1].map((ratio) => {
            const y = chartHeight * (1 - ratio);
            const valLabel = Math.round(maxVal * ratio);
            return (
              <g key={ratio}>
                <line x1="0" y1={y} x2="100%" y2={y} stroke="#E2E8F0" strokeDasharray="3 3" />
                <text x="0" y={y - 4} fill="#94A3B8" fontSize="10" fontWeight="500">
                  {valLabel} units
                </text>
              </g>
            );
          })}

          {/* Render Demand Bars */}
          {dailyForecast.map((item, idx) => {
            const count = dailyForecast.length;
            const barWidthPercent = Math.min(8, 70 / count);
            const xPercent = ((idx + 0.5) / count) * 100;
            const barHeight = maxVal > 0 ? (item.predictedDemand / maxVal) * (chartHeight - 20) : 0;
            const y = chartHeight - barHeight;
            const isHovered = hoveredItem?.date === item.date;

            return (
              <g
                key={item.date}
                onMouseEnter={() => setHoveredItem(item)}
                onMouseLeave={() => setHoveredItem(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Bar */}
                <rect
                  x={`${xPercent - barWidthPercent / 2}%`}
                  y={y}
                  width={`${barWidthPercent}%`}
                  height={Math.max(barHeight, 4)}
                  rx="4"
                  fill={isHovered ? '#4338CA' : '#6366F1'}
                  opacity={isHovered ? 1 : 0.9}
                  style={{ transition: 'all 0.15s ease' }}
                />

                {/* Value label on bar top */}
                <text
                  x={`${xPercent}%`}
                  y={y - 6}
                  textAnchor="middle"
                  fill="#4F46E5"
                  fontSize="10"
                  fontWeight="700"
                >
                  {item.predictedDemand}
                </text>

                {/* X-axis date label */}
                <text
                  x={`${xPercent}%`}
                  y={chartHeight + 18}
                  textAnchor="middle"
                  fill="#64748B"
                  fontSize="10"
                  fontWeight="500"
                >
                  {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip */}
        {hoveredItem && (
          <div style={{
            position: 'absolute', top: 0, right: 10,
            background: '#0F172A', color: 'white',
            padding: '6px 12px', borderRadius: 6,
            fontSize: '0.75rem', fontWeight: 500,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            pointerEvents: 'none', zIndex: 10,
          }}>
            <div>Date: {hoveredItem.date}</div>
            <div style={{ color: '#818CF8', fontWeight: 700 }}>
              Forecast: {hoveredItem.predictedDemand} units
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

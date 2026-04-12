import React, { useEffect, useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { Product } from '../../types/product';
import type { PricePoint } from '../../types/product';

interface Props {
  products: Product[];
}

// Distinct colors for up to 5 products
const COLORS = ['#e47911', '#2563eb', '#059669', '#dc2626', '#7c3aed'];

interface ChartPoint {
  date: string;
  timestamp: number;
  [asin: string]: number | string;
}

export function PriceHistoryChart({ products }: Props) {
  const [historyMap, setHistoryMap] = useState<Record<string, PricePoint[]>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (products.length < 2) return;

    setLoading(true);
    let completed = 0;

    products.forEach((p) => {
      chrome.runtime.sendMessage(
        { type: 'FETCH_PRICE_HISTORY', asin: p.asin },
        (res) => {
          if (res?.points) {
            setHistoryMap((prev) => ({ ...prev, [p.asin]: res.points }));
          }
          completed++;
          if (completed === products.length) setLoading(false);
        }
      );
    });
  }, [products.map((p) => p.asin).join(',')]);

  // Merge all price histories into a single chart dataset
  const chartData = useMemo(() => {
    if (Object.keys(historyMap).length === 0) return [];

    // Collect all unique dates across all products
    const dateMap = new Map<string, ChartPoint>();

    for (const [asin, points] of Object.entries(historyMap)) {
      for (const pt of points) {
        const date = new Date(pt.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const existing = dateMap.get(date) ?? { date, timestamp: pt.timestamp };
        existing[asin] = pt.price;
        dateMap.set(date, existing as ChartPoint);
      }
    }

    return [...dateMap.values()].sort((a, b) => a.timestamp - b.timestamp);
  }, [historyMap]);

  if (products.length < 2) return null;

  return (
    <div style={{ padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: '#111827' }}>
          Price History (90 days)
        </span>
        {loading && (
          <span style={{ fontSize: 11, color: '#6b7280' }}>Loading...</span>
        )}
      </div>

      {chartData.length > 0 ? (
        <>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `$${v}`}
                width={50}
              />
              <Tooltip
                contentStyle={{ fontSize: 11, borderRadius: 6, border: '1px solid #e5e7eb' }}
                formatter={(value: number, name: string) => {
                  const product = products.find((p) => p.asin === name);
                  const label = product ? product.title.split(/[,\-–]/)[0].trim().slice(0, 25) : name;
                  return [`$${value.toFixed(2)}`, label];
                }}
                labelStyle={{ fontSize: 11, fontWeight: 600 }}
              />

              {/* Current price reference lines */}
              {products.map((p, i) => (
                p.price != null && (
                  <ReferenceLine
                    key={`ref-${p.asin}`}
                    y={p.price}
                    stroke={COLORS[i % COLORS.length]}
                    strokeDasharray="4 4"
                    strokeOpacity={0.4}
                  />
                )
              ))}

              {products.map((p, i) => (
                <Line
                  key={p.asin}
                  type="monotone"
                  dataKey={p.asin}
                  stroke={COLORS[i % COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 3 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 6 }}>
            {products.map((p, i) => (
              <div key={p.asin} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 12, height: 3, borderRadius: 2, background: COLORS[i % COLORS.length] }} />
                <span style={{ fontSize: 10, color: '#6b7280' }}>
                  {p.title.split(/[,\-–]/)[0].trim().slice(0, 20)}
                </span>
              </div>
            ))}
          </div>
        </>
      ) : !loading ? (
        <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>
          Price history data unavailable.
        </p>
      ) : null}
    </div>
  );
}

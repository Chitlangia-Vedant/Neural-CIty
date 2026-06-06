import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatNumber, trendFromValues } from '../utils.js';

export default function CleanlinessChart({ history = {} }) {
  const chartData = Object.entries(history)
    .map(([year, score]) => ({ year, score }))
    .filter((item) => item.score !== null && item.score !== undefined)
    .sort((a, b) => Number(a.year) - Number(b.year));

  const tableData = [...chartData].reverse();

  if (chartData.length === 0) {
    return <p className="empty-copy">Data not available</p>;
  }

  return (
    <div className="chart-section">
      <div className="chart-frame">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData} margin={{ top: 20, right: 24, left: 4, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
            <XAxis dataKey="year" tickLine={false} stroke="var(--muted)" />
            <YAxis tickLine={false} width={72} stroke="var(--muted)" />
            <Tooltip
              formatter={(value) => formatNumber(value, { maximumFractionDigits: 0 })}
              contentStyle={{
                background: 'var(--panel)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                color: 'var(--text)',
              }}
              labelStyle={{ color: 'var(--text-strong)' }}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="var(--brand)"
              strokeWidth={3}
              dot={{ r: 5, fill: 'var(--panel)', stroke: 'var(--brand)', strokeWidth: 2 }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <table className="detail-table">
        <thead>
          <tr>
            <th>Year</th>
            <th>Score</th>
            <th>Change</th>
          </tr>
        </thead>
        <tbody>
          {tableData.map((item, index) => {
            const previous = tableData[index + 1];
            const trend = previous ? trendFromValues(item.score, previous.score) : { label: 'Baseline', className: 'muted' };
            return (
              <tr key={item.year}>
                <td>{item.year}</td>
                <td>{formatNumber(item.score, { maximumFractionDigits: 0 })}</td>
                <td className={trend.className}>{trend.label}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatNumber } from '../utils.js';

const labels = {
  road: 'Road',
  railway: 'Railway',
  railwayTrack: 'Railway Track',
  railwayCrossing: 'Railway Crossing',
};

export default function TrafficChart({ breakdown = {} }) {
  const chartData = Object.entries(labels).map(([key, label]) => ({
    type: label,
    cases: breakdown[key]?.cases || 0,
    injured: breakdown[key]?.injured || 0,
    died: breakdown[key]?.died || 0,
  }));

  const totals = breakdown.totals || { cases: 0, injured: 0, died: 0 };
  const fatalRate = totals.cases ? (totals.died / totals.cases) * 100 : 0;
  const injuryRate = totals.cases ? (totals.injured / totals.cases) * 100 : 0;

  return (
    <div className="chart-section">
      <div className="chart-frame">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} layout="vertical" margin={{ top: 12, right: 24, left: 24, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
            <XAxis type="number" tickLine={false} stroke="var(--muted)" />
            <YAxis dataKey="type" type="category" width={112} tickLine={false} stroke="var(--muted)" />
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
            <Bar dataKey="cases" name="Cases" fill="var(--brand)" radius={[0, 4, 4, 0]} />
            <Bar dataKey="injured" name="Injured" fill="var(--warning)" radius={[0, 4, 4, 0]} />
            <Bar dataKey="died" name="Died" fill="var(--danger)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <table className="detail-table">
        <thead>
          <tr>
            <th>Type</th>
            <th>Cases</th>
            <th>Injured</th>
            <th>Died</th>
          </tr>
        </thead>
        <tbody>
          {chartData.map((row) => (
            <tr key={row.type}>
              <td>{row.type}</td>
              <td>{formatNumber(row.cases, { maximumFractionDigits: 0 })}</td>
              <td>{formatNumber(row.injured, { maximumFractionDigits: 0 })}</td>
              <td>{formatNumber(row.died, { maximumFractionDigits: 0 })}</td>
            </tr>
          ))}
          <tr className="total-row">
            <td>Total</td>
            <td>{formatNumber(totals.cases, { maximumFractionDigits: 0 })}</td>
            <td>{formatNumber(totals.injured, { maximumFractionDigits: 0 })}</td>
            <td>{formatNumber(totals.died, { maximumFractionDigits: 0 })}</td>
          </tr>
        </tbody>
      </table>

      <div className="severity-grid">
        <span>Fatality rate: {formatNumber(fatalRate, { maximumFractionDigits: 1 })}%</span>
        <span>Injury rate: {formatNumber(injuryRate, { maximumFractionDigits: 1 })}%</span>
      </div>
    </div>
  );
}

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ATTACK_MODULES } from '@/data/mockData';

const COLORS = ['#00E5FF', '#00FF87', '#FFB800', '#FF2D6B', '#9D4EDD', '#00E5FF80', '#00FF8780'];

const data = ATTACK_MODULES.map((m, i) => ({
  name: m.name,
  value: Math.floor(Math.random() * 40 + 10),
  color: COLORS[i],
}));

export function ModuleDonutChart() {
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={70} outerRadius={110} dataKey="value" stroke="none">
            {data.map((d, i) => <Cell key={i} fill={d.color} />)}
          </Pie>
          <Tooltip
            content={({ active, payload }: any) =>
              active && payload?.[0] ? (
                <div className="glass-card p-2 text-xs">
                  <span className="text-text-primary">{payload[0].name}: {payload[0].value}</span>
                </div>
              ) : null
            }
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          <div className="font-display font-black text-2xl text-text-primary">{total}</div>
          <div className="text-[10px] text-text-muted">TOTAL</div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mt-2 justify-center">
        {data.map((d, i) => (
          <span key={i} className="flex items-center gap-1 text-[10px] text-text-secondary">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
            {d.name}
          </span>
        ))}
      </div>
    </div>
  );
}

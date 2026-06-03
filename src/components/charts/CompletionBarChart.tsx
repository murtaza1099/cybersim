import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useDataStore } from '@/store/dataStore';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;
  return (
    <div className="glass-card p-3 text-xs">
      <p className="text-text-primary font-display text-sm">{label}</p>
      <p className="text-cyan">{payload[0]?.value}% completion</p>
    </div>
  );
};

export function CompletionBarChart() {
  const organizations = useDataStore(s => s.organizations);
  const employees = useDataStore(s => s.employees);

  const data = organizations.map(o => {
    const orgEmps = employees.filter(e => e.orgId === o.id);
    if (orgEmps.length === 0) return { name: o.name, rate: 0 };
    const avg = Math.round(orgEmps.reduce((sum, e) => {
      const scores = Object.values(e.moduleProgress).filter(v => v > 0);
      return sum + (scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0);
    }, 0) / orgEmps.length);
    return { name: o.name, rate: avg };
  });

  if (data.length === 0) {
    return <div className="h-[280px] flex items-center justify-center text-text-muted text-sm">No organizations yet</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,229,255,0.06)" />
        <XAxis dataKey="name" tick={{ fill: '#8896B3', fontSize: 11, fontFamily: 'DM Sans' }} axisLine={{ stroke: 'rgba(0,229,255,0.1)' }} />
        <YAxis tick={{ fill: '#8896B3', fontSize: 11 }} axisLine={{ stroke: 'rgba(0,229,255,0.1)' }} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="rate" fill="hsl(187, 100%, 50%)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

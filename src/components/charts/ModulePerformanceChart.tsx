import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ATTACK_MODULES } from '@/data/mockData';
import { useDataStore, type Employee } from '@/store/dataStore';

export function ModulePerformanceChart({ orgId }: { orgId?: string }) {
  const allEmployees = useDataStore(s => s.employees);
  const emps = orgId ? allEmployees.filter(e => e.orgId === orgId) : allEmployees;

  const data = ATTACK_MODULES.map(m => {
    const scores = emps.map(e => e.moduleProgress[m.id] || 0);
    const pass = scores.filter(s => s >= 70).length;
    const fail = scores.filter(s => s > 0 && s < 70).length;
    return { name: m.icon, pass, fail };
  });

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,229,255,0.06)" />
        <XAxis dataKey="name" tick={{ fontSize: 16 }} axisLine={{ stroke: 'rgba(0,229,255,0.1)' }} />
        <YAxis tick={{ fill: '#8896B3', fontSize: 11 }} axisLine={{ stroke: 'rgba(0,229,255,0.1)' }} />
        <Tooltip content={({ active, payload, label }: any) =>
          active && payload ? (
            <div className="glass-card p-2 text-xs">
              <p className="mb-1">{label}</p>
              <p className="text-green">Pass: {payload[0]?.value}</p>
              <p className="text-red">Fail: {payload[1]?.value}</p>
            </div>
          ) : null
        } />
        <Bar dataKey="pass" stackId="a" fill="#00FF87" radius={[0, 0, 0, 0]} />
        <Bar dataKey="fail" stackId="a" fill="#FF2D6B" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

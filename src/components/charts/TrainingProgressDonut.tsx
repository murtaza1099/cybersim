import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useDataStore, type Employee } from '@/store/dataStore';

export function TrainingProgressDonut({ orgId }: { orgId?: string }) {
  const allEmployees = useDataStore(s => s.employees);
  const emps = orgId ? allEmployees.filter(e => e.orgId === orgId) : allEmployees;

  const getStage = (e: Employee) => {
    const scores = Object.values(e.moduleProgress);
    const done = scores.filter(s => s >= 70).length;
    if (done === 0) return 'Not Started';
    if (e.level >= 3) return 'Completed L3';
    if (e.level >= 2) return 'Completed L2';
    if (done === 7) return 'Completed L1';
    return 'In Progress';
  };

  const stages = ['Not Started', 'In Progress', 'Completed L1', 'Completed L2', 'Completed L3'];
  const colors = ['#4A5568', '#00E5FF', '#00FF87', '#FFB800', '#9D4EDD'];

  const data = stages.map((stage, i) => ({
    name: stage,
    value: emps.filter(e => getStage(e) === stage).length,
    color: colors[i],
  })).filter(d => d.value > 0);

  if (data.length === 0) {
    return <div className="h-[280px] flex items-center justify-center text-text-muted text-sm">No employee data yet</div>;
  }

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={65} outerRadius={105} dataKey="value" stroke="none">
            {data.map((d, i) => <Cell key={i} fill={d.color} />)}
          </Pie>
          <Tooltip content={({ active, payload }: any) =>
            active && payload?.[0] ? (
              <div className="glass-card p-2 text-xs">{payload[0].name}: {payload[0].value}</div>
            ) : null
          } />
        </PieChart>
      </ResponsiveContainer>
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

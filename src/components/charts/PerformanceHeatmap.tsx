import { ATTACK_MODULES } from '@/data/mockData';
import { useDataStore } from '@/store/dataStore';

export function PerformanceHeatmap({ orgId }: { orgId?: string }) {
  const allEmployees = useDataStore(s => s.employees);
  const employees = orgId ? allEmployees.filter(e => e.orgId === orgId) : allEmployees.slice(0, 20);

  const getColor = (score: number) => {
    if (score === 0) return 'bg-elevated';
    if (score >= 80) return 'bg-green/30 border-green/20';
    if (score >= 50) return 'bg-amber/30 border-amber/20';
    return 'bg-red/30 border-red/20';
  };

  if (employees.length === 0) {
    return <div className="h-[200px] flex items-center justify-center text-text-muted text-sm">No employee data yet</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr>
            <th className="text-left text-text-muted font-display text-[10px] tracking-wider p-2">EMPLOYEE</th>
            {ATTACK_MODULES.map(m => (
              <th key={m.id} className="text-center text-text-muted font-display text-[10px] tracking-wider p-2">{m.icon}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {employees.map(emp => (
            <tr key={emp.id}>
              <td className="p-2 text-text-secondary whitespace-nowrap">{emp.name}</td>
              {ATTACK_MODULES.map(m => {
                const score = emp.moduleProgress[m.id] || 0;
                return (
                  <td key={m.id} className="p-1">
                    <div
                      className={`w-8 h-8 rounded border flex items-center justify-center text-[10px] font-mono ${getColor(score)}`}
                      title={`${emp.name} — ${m.name}: ${score}%`}
                    >
                      {score > 0 ? score : '—'}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

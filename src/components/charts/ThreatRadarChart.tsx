import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { ATTACK_MODULES } from '@/data/mockData';

interface Props {
  scores: Record<string, number>;
}

export function ThreatRadarChart({ scores }: Props) {
  const data = ATTACK_MODULES.map(m => ({
    subject: m.name.split(' ')[0],
    score: scores[m.id] || 0,
    fullMark: 100,
  }));

  return (
    <ResponsiveContainer width="100%" height={320}>
      <RadarChart data={data}>
        <PolarGrid stroke="rgba(0,229,255,0.1)" />
        <PolarAngleAxis dataKey="subject" tick={{ fill: '#8896B3', fontSize: 11, fontFamily: 'DM Sans' }} />
        <Radar name="Score" dataKey="score" stroke="#00E5FF" fill="#00E5FF" fillOpacity={0.2} strokeWidth={2} />
        <Tooltip
          content={({ active, payload }: any) =>
            active && payload?.[0] ? (
              <div className="glass-card p-2 text-xs text-cyan">{payload[0].payload.subject}: {payload[0].value}%</div>
            ) : null
          }
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Building2, KeyRound, BarChart3, Download, Users, AlertTriangle, CheckCircle, Eye, EyeOff, Copy, Check, X, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useDataStore } from '@/store/dataStore';
import { DashboardSidebar } from '@/components/layout/Sidebar';
import { GlassCard } from '@/components/ui/GlassCard';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { NeonButton } from '@/components/ui/NeonButton';
import { CompletionBarChart } from '@/components/charts/CompletionBarChart';
import { ModuleDonutChart } from '@/components/charts/ModuleDonutChart';
import { maskKey } from '@/utils/keyParser';
import { formatDate } from '@/utils/formatters';

const tabs = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'orgs', label: 'Organizations', icon: Building2 },
  { id: 'keyvault', label: 'Key Vault', icon: KeyRound },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'export', label: 'Export Center', icon: Download },
];

export default function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const { userName, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div className="min-h-screen bg-[hsl(var(--bg-void))] flex justify-center">
      <div className="w-full max-w-[1440px] flex min-h-screen">
      <DashboardSidebar
        title="CONTROL CENTER"
        roleLabel="SUPER ADMIN"
        roleColor="red"
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        userName={userName || 'Admin'}
        onLogout={handleLogout}
      />
      <main className="flex-1 min-h-screen overflow-y-auto bg-[hsl(var(--bg-void))]">
        {/* Sticky page header */}
        <div className="sticky top-0 z-20 bg-[hsl(var(--bg-void)/0.9)] backdrop-blur-md border-b border-border/50 px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-display text-[10px] tracking-[0.25em] text-text-muted">CONTROL CENTER</span>
            <span className="text-border">›</span>
            <span className="font-display text-[11px] tracking-[0.15em] text-cyan capitalize">{activeTab.replace('-', ' ')}</span>
          </div>
          <span className="font-mono text-[10px] text-text-muted">{new Date().toLocaleString()}</span>
        </div>
        <div className="p-8">
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'orgs' && <OrgsTab />}
          {activeTab === 'keyvault' && <KeyVaultTab />}
          {activeTab === 'analytics' && <AnalyticsTab />}
          {activeTab === 'export' && <ExportTab />}
        </div>
      </main>
      </div>
    </div>
  );
}

function OverviewTab() {
  const orgs = useDataStore(s => s.organizations);
  const employees = useDataStore(s => s.employees);

  const totalEmps = employees.length;
  const avgCompletion = orgs.length > 0 ? Math.round(orgs.reduce((s, o) => {
    const orgEmps = employees.filter(e => e.orgId === o.id);
    if (orgEmps.length === 0) return s;
    const avg = orgEmps.reduce((sum, e) => {
      const scores = Object.values(e.moduleProgress).filter((v): v is number => typeof v === 'number' && v > 0);
      return sum + (scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0);
    }, 0) / orgEmps.length;
    return s + avg;
  }, 0) / orgs.length) : 0;

  const highRisk = employees.filter(e => {
    const scores = Object.values(e.moduleProgress).filter((v): v is number => typeof v === 'number');
    return scores.some(s => s > 0 && s < 50);
  }).length;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="font-display font-bold text-2xl text-text-primary mb-8">Platform Overview</h1>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard icon={Building2} value={orgs.length} label="Total Organizations" color="cyan" delay={0} />
        <StatCard icon={Users} value={totalEmps} label="Active Employees" color="green" delay={0.1} />
        <StatCard icon={CheckCircle} value={avgCompletion} suffix="%" label="Avg Completion" color="amber" delay={0.2} />
        <StatCard icon={AlertTriangle} value={highRisk} label="High Risk Users" color="red" delay={0.3} />
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <GlassCard>
          <h3 className="font-display text-sm tracking-wider text-text-secondary mb-4">ORGANIZATION COMPLETION RATES</h3>
          <CompletionBarChart />
        </GlassCard>
        <GlassCard>
          <h3 className="font-display text-sm tracking-wider text-text-secondary mb-4">ATTACK MODULE DISTRIBUTION</h3>
          <ModuleDonutChart />
        </GlassCard>
      </div>

      {orgs.length > 0 && (
        <GlassCard>
          <h3 className="font-display text-sm tracking-wider text-text-secondary mb-4">ORGANIZATIONS</h3>
          <OrgTable />
        </GlassCard>
      )}

      {orgs.length === 0 && (
        <GlassCard className="text-center py-12">
          <Building2 className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <h3 className="font-display text-lg text-text-primary mb-2">No Organizations Yet</h3>
          <p className="text-text-secondary text-sm mb-4">Create your first organization to get started</p>
        </GlassCard>
      )}
    </motion.div>
  );
}

function OrgTable() {
  const orgs = useDataStore(s => s.organizations);
  const employees = useDataStore(s => s.employees);
  const updateOrgStatus = useDataStore(s => s.updateOrgStatus);
  const revokeOrgKey = useDataStore(s => s.revokeOrgKey);
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const revealKey = (id: string) => {
    setRevealedKeys(p => ({ ...p, [id]: true }));
    setTimeout(() => setRevealedKeys(p => ({ ...p, [id]: false })), 5000);
  };

  const copyKey = (id: string, key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-elevated">
            {['#', 'Organization', 'Created', 'Users', 'Org Key', 'Status', 'Actions'].map(h => (
              <th key={h} className="text-left p-3 text-text-muted font-display text-[10px] tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {orgs.map((org, i) => {
            const empCount = employees.filter(e => e.orgId === org.id).length;
            return (
              <tr key={org.id} className="border-t border-border hover:bg-surface-hover/50 transition-colors group">
                <td className="p-3 text-text-muted">{i + 1}</td>
                <td className="p-3 text-text-primary font-medium">{org.name}</td>
                <td className="p-3 text-text-secondary text-xs">{formatDate(org.createdAt)}</td>
                <td className="p-3 text-text-primary">{empCount}</td>
                <td className="p-3">
                  <span className="font-mono text-xs text-text-muted">
                    {revealedKeys[org.id] ? org.orgKey : maskKey(org.orgKey)}
                  </span>
                  <div className="inline-flex ml-2 gap-1">
                    <button onClick={() => revealKey(org.id)} className="text-text-muted hover:text-cyan transition-colors">
                      {revealedKeys[org.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </button>
                    <button onClick={() => copyKey(org.id, org.orgKey)} className="text-text-muted hover:text-cyan transition-colors">
                      {copiedId === org.id ? <Check className="w-3 h-3 text-green" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </td>
                <td className="p-3"><StatusBadge status={org.status} /></td>
                <td className="p-3">
                  <div className="flex gap-1">
                    <button onClick={() => revokeOrgKey(org.id)} className="text-text-muted hover:text-cyan transition-colors text-xs">Regen Key</button>
                    <button
                      onClick={() => updateOrgStatus(org.id, org.status === 'active' ? 'suspended' : 'active')}
                      className="text-text-muted hover:text-red transition-colors text-xs ml-2"
                    >
                      {org.status === 'active' ? 'Suspend' : 'Activate'}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function OrgsTab() {
  const [showModal, setShowModal] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [generatedKey, setGeneratedKey] = useState('');
  const [copied, setCopied] = useState(false);
  const addOrganization = useDataStore(s => s.addOrganization);

  const handleCreate = () => {
    if (!orgName.trim()) return;
    const key = addOrganization(orgName.trim());
    setGeneratedKey(key);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setShowModal(false);
    setOrgName('');
    setGeneratedKey('');
    setCopied(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-display font-bold text-2xl text-text-primary">Organizations</h1>
        <NeonButton size="sm" onClick={() => setShowModal(true)}>Create Organization</NeonButton>
      </div>
      <GlassCard>
        <OrgTable />
      </GlassCard>

      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative z-10 w-full max-w-md"
            >
              <GlassCard glow="cyan" className="relative">
                <button onClick={handleClose} className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors">
                  <X className="w-5 h-5" />
                </button>
                <h2 className="font-display font-bold text-xl text-text-primary mb-1">Create Organization</h2>
                <p className="text-text-secondary text-sm mb-6">Add a new organization to the platform</p>

                {!generatedKey ? (
                  <div>
                    <label className="font-display text-[10px] tracking-[0.2em] text-cyan mb-2 block">ORGANIZATION NAME</label>
                    <input
                      type="text"
                      value={orgName}
                      onChange={e => setOrgName(e.target.value)}
                      placeholder="Enter organization name"
                      className="w-full bg-elevated border border-border rounded-lg px-4 py-3 font-body text-sm text-text-primary placeholder:text-text-muted/40 outline-none focus:border-cyan focus:shadow-[0_0_20px_rgba(0,229,255,0.15)] transition-all mb-6"
                      autoFocus
                      onKeyDown={e => e.key === 'Enter' && handleCreate()}
                    />
                    <NeonButton onClick={handleCreate} className="w-full" disabled={!orgName.trim()}>
                      Generate Access Key
                    </NeonButton>
                  </div>
                ) : (
                  <div>
                    <p className="text-text-secondary text-sm mb-2">Organization <span className="text-text-primary font-semibold">{orgName}</span> created!</p>
                    <label className="font-display text-[10px] tracking-[0.2em] text-cyan mb-2 block">GENERATED KEY</label>
                    <div className="flex items-center gap-2 bg-elevated border border-border rounded-lg px-4 py-3 mb-3">
                      <code className="font-mono text-sm text-cyan flex-1 tracking-wider">{generatedKey}</code>
                      <button onClick={handleCopy} className="text-text-muted hover:text-cyan transition-colors">
                        {copied ? <Check className="w-4 h-4 text-green" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                    <div className="flex items-start gap-2 bg-amber/10 border border-amber/20 rounded-lg p-3 mb-6">
                      <AlertCircle className="w-4 h-4 text-amber mt-0.5 shrink-0" />
                      <p className="text-amber text-xs">Copy this key now — it will only be shown once. Use it to log in as Org Admin.</p>
                    </div>
                    <NeonButton onClick={handleClose} className="w-full">Done</NeonButton>
                  </div>
                )}
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function KeyVaultTab() {
  const orgs = useDataStore(s => s.organizations);
  const employees = useDataStore(s => s.employees);

  const allKeys = [
    ...orgs.map(o => ({ id: o.id, type: 'ORG', org: o.name, key: o.orgKey, created: o.createdAt, status: o.status as 'active' | 'suspended' })),
    ...employees.map(e => {
      const org = orgs.find(o => o.id === e.orgId);
      return { id: e.id, type: 'EMP', org: org?.name || 'Unknown', key: e.empKey, created: e.lastActive, status: e.status as 'active' | 'inactive' };
    }),
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="font-display font-bold text-2xl text-text-primary mb-6">Key Vault</h1>
      <GlassCard>
        {allKeys.length === 0 ? (
          <div className="text-center py-12 text-text-muted">No keys generated yet. Create an organization first.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-elevated">
                  {['Key ID', 'Type', 'Organization', 'Created', 'Status'].map(h => (
                    <th key={h} className="text-left p-3 text-text-muted font-display text-[10px] tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allKeys.map(k => (
                  <tr key={k.id} className="border-t border-border hover:bg-surface-hover/50 transition-colors">
                    <td className="p-3 font-mono text-xs text-text-muted">{maskKey(k.key)}</td>
                    <td className="p-3"><span className="font-display text-[10px] tracking-wider text-cyan">{k.type}</span></td>
                    <td className="p-3 text-text-secondary">{k.org}</td>
                    <td className="p-3 text-text-secondary text-xs">{formatDate(k.created)}</td>
                    <td className="p-3"><StatusBadge status={k.status as any} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </motion.div>
  );
}

function AnalyticsTab() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="font-display font-bold text-2xl text-text-primary mb-6">Analytics</h1>
      <div className="grid grid-cols-2 gap-6">
        <GlassCard>
          <h3 className="font-display text-sm tracking-wider text-text-secondary mb-4">ORGANIZATION COMPLETION</h3>
          <CompletionBarChart />
        </GlassCard>
        <GlassCard>
          <h3 className="font-display text-sm tracking-wider text-text-secondary mb-4">MODULE DISTRIBUTION</h3>
          <ModuleDonutChart />
        </GlassCard>
      </div>
    </motion.div>
  );
}

function ExportTab() {
  const orgs = useDataStore(s => s.organizations);
  const employees = useDataStore(s => s.employees);

  const handleExport = (type: string) => {
    const csvContent = type === 'orgs'
      ? 'Name,Created,Status\n' + orgs.map(o => `${o.name},${o.createdAt},${o.status}`).join('\n')
      : 'Name,Email,Level,XP,OrgId\n' + employees.map(e => `${e.name},${e.email},${e.level},${e.xp},${e.orgId}`).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cybersim_${type}_export.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="font-display font-bold text-2xl text-text-primary mb-6">Export Center</h1>
      <div className="grid grid-cols-2 gap-6">
        <GlassCard glow="cyan">
          <Download className="w-8 h-8 text-cyan mb-4" />
          <h3 className="font-display font-bold text-lg text-text-primary mb-2">Export Organizations</h3>
          <p className="text-text-secondary text-sm mb-6">Organization names, creation dates, status</p>
          <NeonButton onClick={() => handleExport('orgs')} disabled={orgs.length === 0}>Export CSV</NeonButton>
        </GlassCard>
        <GlassCard glow="green">
          <Users className="w-8 h-8 text-green mb-4" />
          <h3 className="font-display font-bold text-lg text-text-primary mb-2">Export All Users</h3>
          <p className="text-text-secondary text-sm mb-6">Names, emails, levels, scores, XP</p>
          <NeonButton onClick={() => handleExport('users')} disabled={employees.length === 0}>Export CSV</NeonButton>
        </GlassCard>
      </div>
    </motion.div>
  );
}

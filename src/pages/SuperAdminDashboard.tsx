import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { LayoutDashboard, Building2, BarChart3, Download, Users, AlertTriangle, CheckCircle, X, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useDataStore } from '@/store/dataStore';
import { useOrganizations, useEmployees } from '@/hooks/useOrgData';
import { useLiveAnalytics } from '@/hooks/useLiveAnalytics';
import { DashboardSidebar } from '@/components/layout/Sidebar';
import { GlassCard } from '@/components/ui/GlassCard';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { NeonButton } from '@/components/ui/NeonButton';
import { CompletionBarChart } from '@/components/charts/CompletionBarChart';
import { ModuleDonutChart } from '@/components/charts/ModuleDonutChart';
import { LiveActivityPanel } from '@/components/analytics/LiveActivityPanel';
import { formatDate } from '@/utils/formatters';

const tabs = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'orgs', label: 'Organizations', icon: Building2 },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'export', label: 'Export Center', icon: Download },
];

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-text-muted">
      <Loader2 className="w-8 h-8 animate-spin text-cyan mb-3" />
      <span className="font-display text-sm tracking-wider">Loading platform data…</span>
    </div>
  );
}

function ErrorState() {
  return (
    <GlassCard className="text-center py-16">
      <AlertTriangle className="w-10 h-10 text-red mx-auto mb-4" />
      <h3 className="font-display text-lg text-text-primary mb-2">Couldn’t load data</h3>
      <p className="text-text-secondary text-sm mb-4">There was a problem reaching the database.</p>
      <NeonButton size="sm" onClick={() => window.location.reload()}>Retry</NeonButton>
    </GlassCard>
  );
}

export default function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const { userName, logout } = useAuthStore();
  const navigate = useNavigate();
  const handleLogout = async () => { await logout(); navigate('/'); };

  const orgsQuery = useOrganizations();
  const empsQuery = useEmployees();
  const isLoading = orgsQuery.isLoading || empsQuery.isLoading;
  const isError = orgsQuery.isError || empsQuery.isError;
  useLiveAnalytics();

  useEffect(() => {
    if (isError) toast.error('Failed to load platform data.');
  }, [isError]);

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
          {isLoading ? (
            <LoadingState />
          ) : isError ? (
            <ErrorState />
          ) : (
            <>
              {activeTab === 'overview' && <OverviewTab />}
              {activeTab === 'orgs' && <OrgsTab />}
              {activeTab === 'analytics' && <AnalyticsTab />}
              {activeTab === 'export' && <ExportTab />}
            </>
          )}
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

      <LiveActivityPanel />

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

      {orgs.length > 0 ? (
        <GlassCard>
          <h3 className="font-display text-sm tracking-wider text-text-secondary mb-4">ORGANIZATIONS</h3>
          <OrgTable />
        </GlassCard>
      ) : (
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

  const toggleStatus = async (orgId: string, current: 'active' | 'suspended') => {
    try {
      await updateOrgStatus(orgId, current === 'active' ? 'suspended' : 'active');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update organization');
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-elevated">
            {['#', 'Organization', 'Created', 'Users', 'Status', 'Actions'].map(h => (
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
                <td className="p-3"><StatusBadge status={org.status} /></td>
                <td className="p-3">
                  <button
                    onClick={() => toggleStatus(org.id, org.status)}
                    className="text-text-muted hover:text-red transition-colors text-xs"
                  >
                    {org.status === 'active' ? 'Suspend' : 'Activate'}
                  </button>
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
  const [creating, setCreating] = useState(false);
  const addOrganization = useDataStore(s => s.addOrganization);

  const handleCreate = async () => {
    if (!orgName.trim()) return;
    setCreating(true);
    try {
      const org = await addOrganization(orgName.trim());
      toast.success(`Organization “${org.name}” created`);
      handleClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not create organization');
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setOrgName('');
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
                <NeonButton onClick={handleCreate} className="w-full" disabled={!orgName.trim()} loading={creating}>
                  Create Organization
                </NeonButton>
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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

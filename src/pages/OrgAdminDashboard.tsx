import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { LayoutDashboard, Users, BarChart3, Download, CheckCircle, Trophy, Target, Search, Plus, X, ChevronDown, AlertCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useDataStore, type Employee, type CreatedEmployee } from '@/store/dataStore';
import { useOrganizations, useEmployees } from '@/hooks/useOrgData';
import { KeyReveal } from '@/components/ui/KeyReveal';
import { useLiveAnalytics } from '@/hooks/useLiveAnalytics';
import { DashboardSidebar } from '@/components/layout/Sidebar';
import { GlassCard } from '@/components/ui/GlassCard';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { NeonButton } from '@/components/ui/NeonButton';
import { ModulePerformanceChart } from '@/components/charts/ModulePerformanceChart';
import { TrainingProgressDonut } from '@/components/charts/TrainingProgressDonut';
import { PerformanceHeatmap } from '@/components/charts/PerformanceHeatmap';
import { ThreatRadarChart } from '@/components/charts/ThreatRadarChart';
import { LiveActivityPanel } from '@/components/analytics/LiveActivityPanel';
import { ATTACK_MODULES } from '@/data/mockData';
import { timeAgo } from '@/utils/formatters';

const tabs = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'employees', label: 'Employees', icon: Users },
  { id: 'analytics', label: 'Training Analytics', icon: BarChart3 },
  { id: 'export', label: 'Export', icon: Download },
];

export default function OrgAdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const { userName, orgId, logout } = useAuthStore();
  const navigate = useNavigate();
  const handleLogout = async () => { await logout(); navigate('/'); };

  const orgsQuery = useOrganizations();
  const empsQuery = useEmployees(orgId || undefined);
  const isLoading = orgsQuery.isLoading || empsQuery.isLoading;
  const isError = orgsQuery.isError || empsQuery.isError;
  useLiveAnalytics(orgId || undefined);

  const org = useMemo(() => orgsQuery.organizations.find(o => o.id === (orgId || '')), [orgsQuery.organizations, orgId]);
  const orgEmployees = useMemo(
    () => empsQuery.employees.filter(e => e.orgId === (orgId || '')),
    [empsQuery.employees, orgId],
  );

  useEffect(() => {
    if (isError) toast.error('Failed to load organization data.');
  }, [isError]);

  return (
    <div className="min-h-screen bg-[hsl(var(--bg-void))] flex justify-center">
      <div className="w-full max-w-[1440px] flex min-h-screen">
      <DashboardSidebar
        title="ORGANIZATION HQ"
        roleLabel="ORG ADMIN"
        roleColor="cyan"
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        userName={userName || 'Admin'}
        orgName={org?.name || 'Organization'}
        onLogout={handleLogout}
      />
      <main className="flex-1 min-h-screen overflow-y-auto bg-[hsl(var(--bg-void))]">
        {/* Sticky page header */}
        <div className="sticky top-0 z-20 bg-[hsl(var(--bg-void)/0.9)] backdrop-blur-md border-b border-border/50 px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-display text-[10px] tracking-[0.25em] text-text-muted">ORGANIZATION HQ</span>
            <span className="text-border">›</span>
            <span className="font-display text-[11px] tracking-[0.15em] text-cyan capitalize">{activeTab.replace('-', ' ')}</span>
          </div>
          <span className="font-mono text-[10px] text-text-muted">{org?.name || 'Organization'}</span>
        </div>
        <div className="p-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 text-text-muted">
              <Loader2 className="w-8 h-8 animate-spin text-cyan mb-3" />
              <span className="font-display text-sm tracking-wider">Loading organization data…</span>
            </div>
          ) : isError ? (
            <GlassCard className="text-center py-16">
              <AlertTriangle className="w-10 h-10 text-red mx-auto mb-4" />
              <h3 className="font-display text-lg text-text-primary mb-2">Couldn’t load data</h3>
              <p className="text-text-secondary text-sm mb-4">There was a problem reaching the database.</p>
              <NeonButton size="sm" onClick={() => window.location.reload()}>Retry</NeonButton>
            </GlassCard>
          ) : (
            <>
              {activeTab === 'overview' && <OverviewTab employees={orgEmployees} orgId={orgId || ''} />}
              {activeTab === 'employees' && <EmployeesTab employees={orgEmployees} orgId={orgId || ''} />}
              {activeTab === 'analytics' && <AnalyticsTab employees={orgEmployees} orgId={orgId || ''} />}
              {activeTab === 'export' && <ExportTab employees={orgEmployees} />}
            </>
          )}
        </div>
      </main>
      </div>
    </div>
  );
}

function OverviewTab({ employees, orgId }: { employees: Employee[]; orgId: string }) {
  const l1Done = employees.filter(e => {
    const scores = Object.values(e.moduleProgress) as number[];
    return scores.filter(s => s >= 70).length >= 7;
  }).length;
  const allDone = employees.filter(e => e.level >= 3).length;
  const avgScore = employees.length > 0 ? Math.round(employees.reduce((s, e) => {
    const scores = (Object.values(e.moduleProgress) as number[]).filter(v => v > 0);
    return s + (scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0);
  }, 0) / employees.length) : 0;

  const needsAttention = employees.filter(e => {
    const scores = (Object.values(e.moduleProgress) as number[]).filter(v => v > 0);
    return scores.some(s => s < 50);
  });

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="font-display font-bold text-2xl text-text-primary mb-8">Organization Overview</h1>

      <LiveActivityPanel />

      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users} value={employees.length} label="Total Employees" color="cyan" delay={0} />
        <StatCard icon={CheckCircle} value={l1Done} label="Completed Level 1" color="green" delay={0.1} />
        <StatCard icon={Trophy} value={allDone} label="Completed All Levels" color="amber" delay={0.2} />
        <StatCard icon={Target} value={avgScore} suffix="%" label="Avg Score" color="purple" delay={0.3} />
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <GlassCard>
          <h3 className="font-display text-sm tracking-wider text-text-secondary mb-4">MODULE PERFORMANCE</h3>
          <ModulePerformanceChart orgId={orgId} />
        </GlassCard>
        <GlassCard>
          <h3 className="font-display text-sm tracking-wider text-text-secondary mb-4">TRAINING PROGRESS</h3>
          <TrainingProgressDonut orgId={orgId} />
        </GlassCard>
      </div>

      {needsAttention.length > 0 && (
        <GlassCard glow="red">
          <h3 className="font-display text-sm tracking-wider text-red mb-4 flex items-center gap-2"><AlertCircle className="w-4 h-4" />EMPLOYEES NEEDING ATTENTION</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-elevated">
                {['Name', 'Email', 'Weakest Module', 'Score', 'Last Active', 'Action'].map(h => (
                  <th key={h} className="text-left p-3 text-text-muted font-display text-[10px] tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {needsAttention.map(emp => {
                const entries = Object.entries(emp.moduleProgress).filter(([_, v]) => (v as number) > 0);
                const worst = entries.sort(([, a], [, b]) => (a as number) - (b as number))[0];
                const mod = ATTACK_MODULES.find(m => m.id === worst?.[0]);
                return (
                  <tr key={emp.id} className="border-t border-border hover:bg-surface-hover/50 transition-colors">
                    <td className="p-3 text-text-primary">{emp.name}</td>
                    <td className="p-3 text-text-secondary">{emp.email}</td>
                    <td className="p-3 text-text-secondary">{mod?.icon} {mod?.name}</td>
                    <td className="p-3 text-red">{worst?.[1] as number}%</td>
                    <td className="p-3 text-text-muted text-xs">{timeAgo(emp.lastActive)}</td>
                    <td className="p-3"><NeonButton variant="ghost" size="sm">Send Reminder</NeonButton></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </GlassCard>
      )}

      {employees.length === 0 && (
        <GlassCard className="text-center py-12">
          <Users className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <h3 className="font-display text-lg text-text-primary mb-2">No Employees Yet</h3>
          <p className="text-text-secondary text-sm">Go to the Employees tab to add your first team member</p>
        </GlassCard>
      )}
    </motion.div>
  );
}

function EmployeesTab({ employees, orgId }: { employees: Employee[]; orgId: string }) {
  const [search, setSearch] = useState('');
  const [showPanel, setShowPanel] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newJobRole, setNewJobRole] = useState('');
  const [newAge, setNewAge] = useState('');
  const [newGender, setNewGender] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [createdEmp, setCreatedEmp] = useState<CreatedEmployee | null>(null);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [bulkImportFile, setBulkImportFile] = useState<File | null>(null);
  const [bulkImportParsed, setBulkImportParsed] = useState<Array<Record<string, string>>>([]);
  const [bulkImportResult, setBulkImportResult] = useState<{ imported: number; failed: number } | null>(null);
  const addEmployee = useDataStore(s => s.addEmployee);

  const filtered = employees.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;
    const age = newAge ? parseInt(newAge, 10) : undefined;
    setSubmitting(true);
    try {
      const created = await addEmployee(
        newName.trim(),
        newEmail.trim(),
        orgId,
        newJobRole || undefined,
        age,
        newGender || undefined
      );
      setCreatedEmp(created);
      toast.success(`Employee “${created.name}” created`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not create employee');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClosePanel = () => {
    setShowPanel(false);
    setNewName('');
    setNewEmail('');
    setNewJobRole('');
    setNewAge('');
    setNewGender('');
    setCreatedEmp(null);
  };

  const parseCSV = (csv: string): Array<Record<string, string>> => {
    const lines = csv.trim().split('\n');
    if (lines.length < 2) return [];
    
    const header = lines[0].split(',').map(h => h.trim().toLowerCase());
    const rows: Array<Record<string, string>> = [];
    
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const values = lines[i].split(',').map(v => v.trim());
      const row: Record<string, string> = {};
      header.forEach((key, idx) => {
        row[key] = values[idx] || '';
      });
      rows.push(row);
    }
    
    return rows;
  };

  const handleBulkImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setBulkImportFile(file);
    setBulkImportResult(null);
    
    const text = await file.text();
    const parsed = parseCSV(text);
    setBulkImportParsed(parsed);
  };

  const handleBulkImportDownloadTemplate = () => {
    const csv = 'name,email,jobRole,age,gender\nJohn Doe,john@example.com,IT,35,Male';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'employees_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleBulkImportConfirm = async () => {
    let imported = 0;
    let failed = 0;

    for (const row of bulkImportParsed) {
      const name = row.name?.trim();
      const email = row.email?.trim();

      if (!name || !email) {
        failed++;
        continue;
      }

      const age = row.age ? parseInt(row.age, 10) : undefined;
      const jobRole = row.jobrole || row['job role'] || row['job_role'] || undefined;
      const gender = row.gender || undefined;

      try {
        await addEmployee(name, email, orgId, jobRole, age, gender);
        imported++;
      } catch {
        failed++;
      }
    }

    setBulkImportResult({ imported, failed });
    setBulkImportFile(null);
    setBulkImportParsed([]);
  };

  const handleCloseBulkImportModal = () => {
    setShowBulkImportModal(false);
    setBulkImportFile(null);
    setBulkImportParsed([]);
    setBulkImportResult(null);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-display font-bold text-2xl text-text-primary">Employees</h1>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search employees..."
              className="bg-elevated border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-cyan"
            />
          </div>
          <NeonButton size="sm" onClick={() => setShowPanel(true)}>
            <Plus className="w-3 h-3 mr-1 inline" /> Add Employee
          </NeonButton>
          <NeonButton size="sm" onClick={() => setShowBulkImportModal(true)} variant="ghost">
            <Download className="w-3 h-3 mr-1 inline" /> Bulk Import
          </NeonButton>
        </div>
      </div>

      <GlassCard>
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-text-muted">
            {employees.length === 0 ? 'No employees yet. Click "Add Employee" to get started.' : 'No matching employees found.'}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-elevated">
                {['Name', 'Email', 'Access Key', 'Role', 'Age', 'Gender', 'Level', 'Last Active', 'Status', ''].map(h => (
                  <th key={h} className="text-left p-3 text-text-muted font-display text-[10px] tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(emp => {
                const doneModules = (Object.values(emp.moduleProgress) as number[]).filter(s => s >= 70).length;
                return (
                  <React.Fragment key={emp.id}>
                    <tr
                      className="border-t border-border hover:bg-surface-hover/50 transition-colors cursor-pointer"
                      onClick={() => setExpandedId(expandedId === emp.id ? null : emp.id)}
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-elevated flex items-center justify-center text-xs text-text-secondary">{emp.name.charAt(0)}</div>
                          <span className="text-text-primary">{emp.name}</span>
                        </div>
                      </td>
                      <td className="p-3 text-text-secondary">{emp.email}</td>
                      <td className="p-3" onClick={e => e.stopPropagation()}><KeyReveal value={emp.accessKey} /></td>
                      <td className="p-3 text-text-secondary">{emp.jobRole || '—'}</td>
                      <td className="p-3 text-text-secondary">{emp.age || '—'}</td>
                      <td className="p-3 text-text-secondary">{emp.gender || '—'}</td>
                      <td className="p-3">
                        <div className="flex gap-0.5">
                          {[1, 2, 3].map(l => (
                            <div key={l} className={`w-6 h-1.5 rounded-full ${emp.level >= l ? 'bg-green' : 'bg-elevated'}`} />
                          ))}
                        </div>
                        <span className="text-[10px] text-text-muted">{doneModules}/7</span>
                      </td>
                      <td className="p-3 text-text-muted text-xs">{timeAgo(emp.lastActive)}</td>
                      <td className="p-3"><StatusBadge status={emp.status as any} /></td>
                      <td className="p-3"><ChevronDown className={`w-4 h-4 text-text-muted transition-transform ${expandedId === emp.id ? 'rotate-180' : ''}`} /></td>
                    </tr>
                    <AnimatePresence>
                      {expandedId === emp.id && (
                        <tr>
                          <td colSpan={10}>
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden bg-elevated/50 px-6 py-4"
                            >
                              <div className="grid grid-cols-7 gap-2">
                                {ATTACK_MODULES.map(m => {
                                  const score = emp.moduleProgress[m.id] || 0;
                                  return (
                                    <div key={m.id} className="text-center">
                                      <span className="text-lg">{m.icon}</span>
                                      <div className="w-full h-1 bg-surface rounded-full mt-1 mb-1">
                                        <div className={`h-full rounded-full ${score >= 70 ? 'bg-green' : score > 0 ? 'bg-amber' : 'bg-text-muted/20'}`} style={{ width: `${score}%` }} />
                                      </div>
                                      <span className="text-[10px] text-text-muted">{score}%</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </motion.div>
                          </td>
                        </tr>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </GlassCard>

      {/* Add Employee Panel */}
      <AnimatePresence>
        {showPanel && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={handleClosePanel}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed top-0 right-0 w-[420px] h-full glass-card rounded-none z-50 p-6 overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-display font-bold text-lg text-text-primary">Add Employee</h2>
                <button onClick={handleClosePanel} className="text-text-muted hover:text-text-primary"><X className="w-5 h-5" /></button>
              </div>

              {!createdEmp ? (
                <form onSubmit={handleAddEmployee}>
                  <label className="block mb-4">
                    <span className="font-display text-[10px] tracking-[0.2em] text-cyan mb-1 block">FULL NAME</span>
                    <input
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      className="w-full bg-elevated border border-border rounded-lg px-4 py-3 text-sm text-text-primary outline-none focus:border-cyan"
                      required
                    />
                  </label>
                  <label className="block mb-4">
                    <span className="font-display text-[10px] tracking-[0.2em] text-cyan mb-1 block">EMAIL ADDRESS</span>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={e => setNewEmail(e.target.value)}
                      className="w-full bg-elevated border border-border rounded-lg px-4 py-3 text-sm text-text-primary outline-none focus:border-cyan"
                      required
                    />
                  </label>
                  <label className="block mb-4">
                    <span className="font-display text-[10px] tracking-[0.2em] text-cyan mb-1 block">JOB ROLE (optional)</span>
                    <select
                      value={newJobRole}
                      onChange={e => setNewJobRole(e.target.value)}
                      className="w-full bg-elevated border border-border rounded-lg px-4 py-3 text-sm text-text-primary outline-none focus:border-cyan"
                    >
                      <option value="">Select a role...</option>
                      <option value="HR">HR</option>
                      <option value="IT">IT</option>
                      <option value="Finance">Finance</option>
                      <option value="Operations">Operations</option>
                      <option value="Management">Management</option>
                      <option value="Legal">Legal</option>
                      <option value="Other">Other</option>
                    </select>
                  </label>
                  <label className="block mb-4">
                    <span className="font-display text-[10px] tracking-[0.2em] text-cyan mb-1 block">AGE (optional)</span>
                    <input
                      type="number"
                      min="18"
                      max="80"
                      value={newAge}
                      onChange={e => setNewAge(e.target.value)}
                      className="w-full bg-elevated border border-border rounded-lg px-4 py-3 text-sm text-text-primary outline-none focus:border-cyan"
                    />
                  </label>
                  <label className="block mb-6">
                    <span className="font-display text-[10px] tracking-[0.2em] text-cyan mb-1 block">GENDER (optional)</span>
                    <select
                      value={newGender}
                      onChange={e => setNewGender(e.target.value)}
                      className="w-full bg-elevated border border-border rounded-lg px-4 py-3 text-sm text-text-primary outline-none focus:border-cyan"
                    >
                      <option value="">Select...</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </label>
                  <NeonButton type="submit" className="w-full" size="lg" loading={submitting}>Create Account</NeonButton>
                </form>
              ) : (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle className="w-5 h-5 text-green shrink-0" />
                    <p className="text-text-secondary text-sm">
                      Employee <span className="text-text-primary font-semibold">{createdEmp.name}</span> created.
                    </p>
                  </div>
                  <label className="font-display text-[10px] tracking-[0.2em] text-cyan mb-2 block">EMAIL</label>
                  <div className="bg-elevated border border-border rounded-lg px-4 py-3 mb-4">
                    <code className="font-mono text-sm text-text-primary break-all">{createdEmp.email}</code>
                  </div>
                  <label className="font-display text-[10px] tracking-[0.2em] text-cyan mb-2 block">EMPLOYEE ACCESS KEY</label>
                  <div className="mb-4">
                    <KeyReveal value={createdEmp.empKey} className="w-full justify-between" />
                  </div>
                  <div className="flex items-start gap-2 bg-cyan/10 border border-cyan/20 rounded-lg p-3 mb-6">
                    <AlertCircle className="w-4 h-4 text-cyan mt-0.5 shrink-0" />
                    <p className="text-cyan text-xs">Share this access key with the employee — they sign in with it at the main login. You can reveal &amp; copy it again from the employees table.</p>
                  </div>
                  <NeonButton onClick={handleClosePanel} className="w-full">Done</NeonButton>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bulk Import Modal */}
      <AnimatePresence>
        {showBulkImportModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={handleCloseBulkImportModal}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] max-h-[90vh] glass-card rounded-lg z-50 p-6 overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-display font-bold text-lg text-text-primary">Bulk Import Employees</h2>
                <button onClick={handleCloseBulkImportModal} className="text-text-muted hover:text-text-primary"><X className="w-5 h-5" /></button>
              </div>

              {!bulkImportResult ? (
                <div className="space-y-4">
                  <NeonButton onClick={handleBulkImportDownloadTemplate} variant="ghost" className="w-full">
                    Download CSV Template
                  </NeonButton>

                  <label className="block">
                    <span className="font-display text-[10px] tracking-[0.2em] text-cyan mb-2 block">UPLOAD CSV FILE</span>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleBulkImportFileChange}
                      className="w-full bg-elevated border border-border rounded-lg px-4 py-3 text-sm text-text-primary"
                    />
                  </label>

                  {bulkImportParsed.length > 0 && (
                    <div>
                      <h3 className="font-display text-sm text-text-secondary mb-2">Preview ({bulkImportParsed.length} rows)</h3>
                      <div className="bg-elevated rounded-lg overflow-hidden border border-border">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-surface">
                              {['Name', 'Email', 'Role', 'Age', 'Gender'].map(h => (
                                <th key={h} className="text-left p-2 text-text-muted font-display text-[9px] tracking-wider">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {bulkImportParsed.slice(0, 5).map((row, i) => (
                              <tr key={i} className="border-t border-border">
                                <td className="p-2 text-text-secondary">{row.name || '—'}</td>
                                <td className="p-2 text-text-secondary text-xs">{row.email || '—'}</td>
                                <td className="p-2 text-text-secondary">{row.jobrole || row['job role'] || row['job_role'] || '—'}</td>
                                <td className="p-2 text-text-secondary">{row.age || '—'}</td>
                                <td className="p-2 text-text-secondary">{row.gender || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {bulkImportParsed.length > 5 && (
                          <div className="p-2 text-center text-text-muted text-xs bg-surface">
                            ... and {bulkImportParsed.length - 5} more
                          </div>
                        )}
                      </div>
                      <NeonButton onClick={handleBulkImportConfirm} className="w-full mt-4">
                        Import All
                      </NeonButton>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green mx-auto mb-4" />
                  <p className="text-text-primary font-semibold mb-2">Import Complete</p>
                  <p className="text-text-secondary text-sm mb-6">
                    ✓ {bulkImportResult.imported} imported{bulkImportResult.failed > 0 ? ` ✗ ${bulkImportResult.failed} failed (missing name or email)` : ''}
                  </p>
                  <NeonButton onClick={handleCloseBulkImportModal} className="w-full">
                    Close
                  </NeonButton>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function AnalyticsTab({ employees, orgId }: { employees: Employee[]; orgId: string }) {
  const [selectedEmp, setSelectedEmp] = useState<string | null>(null);
  const emp = employees.find(e => e.id === selectedEmp);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="font-display font-bold text-2xl text-text-primary mb-6">Training Analytics</h1>

      <GlassCard className="mb-6">
        <h3 className="font-display text-sm tracking-wider text-text-secondary mb-4">PERFORMANCE HEATMAP</h3>
        <PerformanceHeatmap orgId={orgId} />
      </GlassCard>

      <GlassCard>
        <h3 className="font-display text-sm tracking-wider text-text-secondary mb-4">INDIVIDUAL ANALYSIS</h3>
        <select
          value={selectedEmp || ''}
          onChange={e => setSelectedEmp(e.target.value || null)}
          className="bg-elevated border border-border rounded-lg px-4 py-2 text-sm text-text-primary outline-none focus:border-cyan mb-4"
        >
          <option value="">Select employee...</option>
          {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
        {emp && <ThreatRadarChart scores={emp.moduleProgress} />}

        {emp?.level1Result?.pcSubAttackResults?.length ? (
          <div className="mt-5">
            <h4 className="font-display text-xs tracking-wider text-text-secondary mb-3">PC WORKSTATION — SUB-ATTACK BREAKDOWN</h4>
            <div className="space-y-1.5">
              {emp.level1Result.pcSubAttackResults.map(r => (
                <div key={r.id} className="flex items-center gap-2 text-sm">
                  <span style={{ color: r.passed ? '#00ff88' : '#ff3355' }}>{r.passed ? '✓' : '✕'}</span>
                  <span className="text-text-primary flex-1">{r.label}</span>
                  <span className="font-mono text-xs" style={{ color: r.passed ? '#00ff88' : '#ff3355' }}>
                    {r.passed ? 'PASS' : 'FAILED'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </GlassCard>
    </motion.div>
  );
}

function ExportTab({ employees }: { employees: Employee[] }) {
  const handleExport = () => {
    const csv = 'Name,Email,Level,XP,Badges\n' + employees.map(e =>
      `${e.name},${e.email},${e.level},${e.xp},${e.badges.length}`
    ).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cybersim_employees_export.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="font-display font-bold text-2xl text-text-primary mb-6">Export</h1>
      <GlassCard glow="cyan">
        <Download className="w-8 h-8 text-cyan mb-4" />
        <h3 className="font-display font-bold text-lg text-text-primary mb-2">Export Employee Data</h3>
        <p className="text-text-secondary text-sm mb-6">Names, emails, levels, scores, XP, badges</p>
        <NeonButton onClick={handleExport} disabled={employees.length === 0}>Export CSV</NeonButton>
      </GlassCard>
    </motion.div>
  );
}

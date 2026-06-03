import { cn } from '@/lib/utils';
import { LucideIcon, Shield, LogOut } from 'lucide-react';

interface SidebarProps {
  title: string;
  roleLabel: string;
  roleColor: 'red' | 'cyan';
  tabs: { id: string; label: string; icon: LucideIcon }[];
  activeTab: string;
  onTabChange: (id: string) => void;
  userName: string;
  orgName?: string;
  onLogout: () => void;
}

const roleColors = {
  red:  'bg-red-dim  text-red  border-red/30',
  cyan: 'bg-cyan-dim text-cyan border-cyan/30',
};

export function DashboardSidebar({ title, roleLabel, roleColor, tabs, activeTab, onTabChange, userName, orgName, onLogout }: SidebarProps) {
  return (
    <div className="w-[260px] h-screen sticky top-0 shrink-0 bg-surface flex flex-col z-40">
      {/* Right gradient border */}
      <div className="absolute top-0 right-0 bottom-0 w-px"
        style={{ background: 'linear-gradient(to bottom, transparent, rgba(0,229,255,0.2) 20%, rgba(0,229,255,0.2) 80%, transparent)' }} />

      {/* Logo area */}
      <div className="p-5 border-b border-border/60">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-lg bg-cyan/10 border border-cyan/20 flex items-center justify-center shrink-0">
            <Shield className="w-4 h-4 text-cyan" />
          </div>
          <div>
            <span className="font-display font-bold text-sm tracking-widest text-text-primary">CYBERSIM</span>
            <div className="font-display text-[9px] tracking-[0.25em] text-text-muted">{title}</div>
          </div>
        </div>
        {orgName && <div className="text-xs text-text-secondary mt-2 pl-0.5">{orgName}</div>}
        <span className={cn('inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-display tracking-wider border', roleColors[roleColor])}>
          {roleLabel}
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto scrollbar-thin">
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => onTabChange(tab.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 font-display text-[11px] tracking-[0.12em] uppercase relative',
                active
                  ? 'bg-elevated text-cyan'
                  : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
              )}>
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-cyan rounded-r-full" />
              )}
              <tab.icon className="w-4 h-4 shrink-0" />
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border/60">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-elevated border border-border flex items-center justify-center text-sm font-display text-text-secondary shrink-0">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-text-primary truncate font-medium">{userName}</div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="status-dot status-dot-online" />
              <span className="text-[10px] text-text-muted font-mono">online</span>
            </div>
          </div>
          <button onClick={onLogout}
            className="text-text-muted hover:text-red transition-colors p-1 rounded hover:bg-red-dim"
            aria-label="Logout">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

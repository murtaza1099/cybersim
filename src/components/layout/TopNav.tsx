import { useAuthStore } from '@/store/authStore';
import { useDataStore } from '@/store/dataStore';
import { useNavigate } from 'react-router-dom';
import { Bell, LogOut, Shield, Zap } from 'lucide-react';

export function TopNav() {
  const { userName, userId, logout } = useAuthStore();
  const emp = useDataStore(s => s.getEmployee(userId || ''));
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <header className="h-14 bg-surface/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-30 relative">
      {/* Gradient bottom border */}
      <div className="absolute bottom-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(to right, transparent, rgba(0,229,255,0.25) 30%, rgba(0,229,255,0.25) 70%, transparent)' }} />

      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-cyan/10 border border-cyan/20 flex items-center justify-center">
          <Shield className="w-3.5 h-3.5 text-cyan" />
        </div>
        <span className="font-display font-bold text-sm tracking-widest text-text-primary">CYBERSIM</span>
        <span className="hidden sm:inline font-mono text-[9px] text-text-muted border border-border/60 rounded px-1.5 py-0.5 ml-1">v1.0</span>
      </div>

      {/* Agent identity */}
      <div className="font-display text-xs tracking-wider text-text-secondary flex items-center gap-1.5">
        <span className="status-dot status-dot-online animate-pulse" />
        <span>Agent:</span>
        <span className="text-cyan">{userName}</span>
        <span className="animate-pulse text-cyan">▋</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <div className="font-display text-xs text-amber neon-text-amber flex items-center gap-1">
          <Zap className="w-3 h-3" />
          {emp?.xp || 0} XP
        </div>
        <div className="w-px h-4 bg-border" />
        <button className="text-text-muted hover:text-cyan transition-colors" aria-label="Notifications">
          <Bell className="w-4 h-4" />
        </button>
        <button onClick={handleLogout} className="text-text-muted hover:text-red transition-colors" aria-label="Logout">
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}

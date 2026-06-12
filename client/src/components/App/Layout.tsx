import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Crosshair, LayoutDashboard, Gamepad2, History, User } from 'lucide-react';
import clsx from 'clsx';
import { ProgressBar } from '../UI/ProgressBar';
import { usePlayerStats } from '../../hooks/usePlayerStats';

const navItems = [
  { to: '/', icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard', end: true },
  { to: '/game', icon: <Gamepad2 className="w-5 h-5" />, label: 'Train', end: false },
  { to: '/history', icon: <History className="w-5 h-5" />, label: 'History', end: false },
  { to: '/profile', icon: <User className="w-5 h-5" />, label: 'Profile', end: false },
];

const RANK_COLORS: Record<string, string> = {
  Bronze: '#CD7F32',
  Silver: '#C0C0C0',
  Gold: '#FFD700',
  Platinum: '#00D4FF',
  Diamond: '#B9F2FF',
  Master: '#6C63FF',
  Grandmaster: '#FF6B9D',
};

export const Layout: React.FC = () => {
  const { profile, rankProgress } = usePlayerStats();
  const rankColor = RANK_COLORS[profile.rank] ?? '#E0E0FF';

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg-primary">
      {/* Sidebar */}
      <aside className="w-16 md:w-56 flex-shrink-0 bg-bg-surface border-r border-white/5 flex flex-col">
        {/* Logo */}
        <div className="px-4 py-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center flex-shrink-0 glow-accent">
              <Crosshair className="w-4 h-4 text-white" />
            </div>
            <div className="hidden md:block">
              <div className="text-sm font-bold text-text-primary leading-none">AimCoach</div>
              <div className="text-xs text-accent mt-0.5">AI</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group',
                  isActive
                    ? 'bg-accent/15 text-accent'
                    : 'text-text-muted hover:text-text-primary hover:bg-white/5'
                )
              }
            >
              {item.icon}
              <span className="hidden md:block text-sm font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Player info */}
        <div className="hidden md:block px-3 py-4 border-t border-white/5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-accent">
                {profile.name.slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-text-primary truncate">{profile.name}</div>
              <div className="text-xs font-semibold" style={{ color: rankColor }}>
                {profile.rank} · Lv.{profile.level}
              </div>
            </div>
          </div>
          <ProgressBar value={rankProgress.progress * 100} color="accent" size="sm" />
          <div className="flex justify-between mt-1">
            <span className="text-xs text-text-muted">{profile.xp.toLocaleString()} XP</span>
            {rankProgress.nextRank && (
              <span className="text-xs text-text-muted">{rankProgress.xpForNext} to {rankProgress.nextRank}</span>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
};

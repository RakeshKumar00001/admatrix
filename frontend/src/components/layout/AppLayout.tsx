import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  BarChart3, Users, Building2, FileText, Settings,
  LogOut, ChevronRight, Activity, Shield,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function AppLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'ADMIN';
  const client = user?.client;

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    logout();
    navigate('/login');
    toast.success('Logged out');
  };

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
      isActive
        ? 'bg-brand-600/20 text-brand-400 border border-brand-700/50'
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
    }`;

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${client?.primaryColor || '#6366f1'}, ${client?.secondaryColor || '#8b5cf6'})` }}
            >
              {client?.logoUrl ? (
                <img src={client.logoUrl} alt="logo" className="w-full h-full object-contain rounded-xl" />
              ) : (
                <BarChart3 className="w-5 h-5 text-white" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-white font-semibold text-sm truncate">
                {client?.name || 'AdMetrics Pro'}
              </p>
              <p className="text-slate-500 text-xs flex items-center gap-1">
                {isAdmin ? <><Shield className="w-3 h-3" /> Admin</> : <><Activity className="w-3 h-3" /> Client</>}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {isAdmin ? (
            <>
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-2 mb-2">Overview</p>
              <NavLink to="/admin" end className={navClass}><BarChart3 className="w-4 h-4" /> Dashboard</NavLink>

              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-2 mt-4 mb-2">Management</p>
              <NavLink to="/admin/clients" className={navClass}><Building2 className="w-4 h-4" /> Clients</NavLink>
              <NavLink to="/admin/users" className={navClass}><Users className="w-4 h-4" /> Users</NavLink>
              <NavLink to="/admin/reports" className={navClass}><FileText className="w-4 h-4" /> Reports</NavLink>
            </>
          ) : (
            <>
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-2 mb-2">Analytics</p>
              <NavLink to="/dashboard" end className={navClass}><BarChart3 className="w-4 h-4" /> Dashboard</NavLink>
              <NavLink to="/reports" className={navClass}><FileText className="w-4 h-4" /> Reports</NavLink>
            </>
          )}
        </nav>

        {/* User info */}
        <div className="px-3 py-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-2 bg-slate-800/50">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all duration-200">
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}

import { Link } from 'react-router-dom';
import { Building2, Users, TrendingUp, Activity, ArrowRight, RefreshCw } from 'lucide-react';
import { useClients } from '../hooks/useClients';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { formatCurrency, formatNumber } from '../lib/utils';

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: React.ReactNode; color: string }) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: color }}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-sm text-slate-400">{label}</p>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { data: clients, isLoading } = useClients();

  const totalClients = clients?.length || 0;
  const activeClients = clients?.filter(c => c.isActive).length || 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Agency Dashboard</h1>
          <p className="text-slate-400 text-sm mt-0.5">Overview of all client accounts</p>
        </div>
        <Link to="/admin/clients" id="manage-clients-btn" className="btn-primary">
          <Building2 className="w-4 h-4" />
          Manage Clients
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Clients" value={totalClients} icon={<Building2 className="w-6 h-6 text-white" />} color="linear-gradient(135deg, #6366f1, #8b5cf6)" />
        <StatCard label="Active Clients" value={activeClients} icon={<Activity className="w-6 h-6 text-white" />} color="linear-gradient(135deg, #10b981, #059669)" />
        <StatCard label="Campaigns Running" value="—" icon={<TrendingUp className="w-6 h-6 text-white" />} color="linear-gradient(135deg, #f59e0b, #d97706)" />
        <StatCard label="Total Users" value="—" icon={<Users className="w-6 h-6 text-white" />} color="linear-gradient(135deg, #ec4899, #db2777)" />
      </div>

      {/* Client list */}
      <div className="card">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="font-semibold text-white">All Clients</h2>
          <Link to="/admin/clients" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-slate-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="divide-y divide-slate-800/50">
            {clients?.map((client) => (
              <div key={client.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors group">
                <div className="flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                    style={{ background: `linear-gradient(135deg, ${client.primaryColor}, ${client.secondaryColor})` }}
                  >
                    {client.name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{client.name}</p>
                    <p className="text-xs text-slate-500">
                      {client._count?.adAccounts || 0} ad accounts · {client._count?.users || 0} users
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`badge ${client.isActive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-700 text-slate-500'}`}>
                    {client.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <Link
                    to={`/admin/clients/${client.id}`}
                    className="btn-secondary py-1.5 px-3 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    View Dashboard <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
            {clients?.length === 0 && (
              <div className="px-6 py-12 text-center text-slate-500">
                <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>No clients yet. <Link to="/admin/clients" className="text-brand-400 hover:underline">Add your first client</Link></p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

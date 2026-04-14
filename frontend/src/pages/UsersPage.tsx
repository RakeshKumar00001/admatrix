import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Users, Shield, Building2, X, Check, Trash2 } from 'lucide-react';
import api from '../lib/api';
import { useClients } from '../hooks/useClients';
import { formatDate } from '../lib/utils';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8, 'Min 8 characters'),
  role: z.enum(['ADMIN', 'CLIENT']),
  clientId: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

function UserModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const { data: clients } = useClients();
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'CLIENT' },
  });

  const role = watch('role');

  const create = useMutation({
    mutationFn: (data: FormData) => api.post('/users', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('User created!'); onClose(); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed'),
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="card w-full max-w-md animate-fade-in shadow-2xl">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="font-semibold text-white">Create User</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400 hover:text-white" /></button>
        </div>
        <form onSubmit={handleSubmit((d) => create.mutate(d))} className="p-6 space-y-4">
          <div>
            <label className="label">Full Name</label>
            <input className="input-field" {...register('name')} placeholder="John Smith" />
            {errors.name && <p className="text-rose-400 text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" className="input-field" {...register('email')} placeholder="john@company.com" />
            {errors.email && <p className="text-rose-400 text-xs mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="label">Password</label>
            <input type="password" className="input-field" {...register('password')} placeholder="Min 8 characters" />
            {errors.password && <p className="text-rose-400 text-xs mt-1">{errors.password.message}</p>}
          </div>
          <div>
            <label className="label">Role</label>
            <select className="input-field" {...register('role')}>
              <option value="CLIENT">Client</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          {role === 'CLIENT' && (
            <div>
              <label className="label">Assign to Client</label>
              <select className="input-field" {...register('clientId')}>
                <option value="">Select client…</option>
                {clients?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={create.isPending} className="btn-primary">
              <Check className="w-4 h-4" /> Create User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get('/users');
      return data.data.users as any[];
    },
  });

  const deactivate = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('User deactivated'); },
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="text-slate-400 text-sm mt-0.5">Manage admin and client user accounts</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary" id="add-user-btn">
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>

      <div className="card">
        <div className="px-6 py-4 border-b border-slate-800">
          <h2 className="font-semibold text-white">All Users</h2>
        </div>
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-slate-800 rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  {['User', 'Role', 'Client', 'Last Login', 'Status', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {users?.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                          {user.name[0]}
                        </div>
                        <div>
                          <p className="font-medium text-slate-200">{user.name}</p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge flex items-center gap-1.5 w-fit ${user.role === 'ADMIN' ? 'bg-amber-500/15 text-amber-400' : 'bg-brand-500/15 text-brand-400'}`}>
                        {user.role === 'ADMIN' ? <Shield className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-sm">{user.client?.name || '—'}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never'}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${user.isActive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-700 text-slate-500'}`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {user.isActive && (
                        <button onClick={() => deactivate.mutate(user.id)} className="btn-danger py-1 px-2">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && <UserModal onClose={() => setShowModal(false)} />}
    </div>
  );
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, Building2, ArrowRight, X, Check, Globe } from 'lucide-react';
import { useClients, useCreateClient, useUpdateClient, useDeleteClient, Client } from '../hooks/useClients';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';

const schema = z.object({
  name: z.string().min(2, 'Name required'),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers, hyphens only'),
  email: z.string().email().optional().or(z.literal('')),
  primaryColor: z.string().default('#6366f1'),
  secondaryColor: z.string().default('#8b5cf6'),
  logoUrl: z.string().url().optional().or(z.literal('')),
});
type FormData = z.infer<typeof schema>;

function ClientModal({ client, onClose }: { client?: Client; onClose: () => void }) {
  const create = useCreateClient();
  const update = useUpdateClient();
  const isEdit = !!client;

  const { register, handleSubmit, formState: { errors }, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: client?.name || '',
      slug: client?.slug || '',
      email: client?.email || '',
      primaryColor: client?.primaryColor || '#6366f1',
      secondaryColor: client?.secondaryColor || '#8b5cf6',
      logoUrl: client?.logoUrl || '',
    },
  });

  const primaryColor = watch('primaryColor');
  const secondaryColor = watch('secondaryColor');

  const onSubmit = async (data: FormData) => {
    if (isEdit) {
      update.mutate({ id: client.id, ...data }, { onSuccess: onClose });
    } else {
      create.mutate(data, { onSuccess: onClose });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="card w-full max-w-lg animate-fade-in shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="font-semibold text-white">{isEdit ? 'Edit Client' : 'New Client'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Preview header */}
          <div className="rounded-xl p-4 text-white text-sm font-medium"
            style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}>
            Client Brand Preview
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Client Name *</label>
              <input className="input-field" placeholder="Acme Corp" {...register('name')} />
              {errors.name && <p className="text-rose-400 text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="label">Slug *</label>
              <input className="input-field" placeholder="acme-corp" {...register('slug')} />
              {errors.slug && <p className="text-rose-400 text-xs mt-1">{errors.slug.message}</p>}
            </div>
          </div>

          <div>
            <label className="label">Email</label>
            <input type="email" className="input-field" placeholder="marketing@acme.com" {...register('email')} />
          </div>

          <div>
            <label className="label">Logo URL</label>
            <input className="input-field" placeholder="https://..." {...register('logoUrl')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Primary Color</label>
              <div className="flex items-center gap-2">
                <input type="color" className="h-10 w-12 rounded-lg border border-slate-700 bg-slate-800 cursor-pointer" {...register('primaryColor')} />
                <input className="input-field flex-1" {...register('primaryColor')} />
              </div>
            </div>
            <div>
              <label className="label">Secondary Color</label>
              <div className="flex items-center gap-2">
                <input type="color" className="h-10 w-12 rounded-lg border border-slate-700 bg-slate-800 cursor-pointer" {...register('secondaryColor')} />
                <input className="input-field flex-1" {...register('secondaryColor')} />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={create.isPending || update.isPending} className="btn-primary">
              <Check className="w-4 h-4" />
              {isEdit ? 'Update Client' : 'Create Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ClientManagement() {
  const { data: clients, isLoading } = useClients();
  const deleteClient = useDeleteClient();
  const [modal, setModal] = useState<'create' | Client | null>(null);

  const handleDelete = (client: Client) => {
    if (!confirm(`Delete ${client.name}? This cannot be undone.`)) return;
    deleteClient.mutate(client.id);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Client Management</h1>
          <p className="text-slate-400 text-sm mt-0.5">Manage agency clients and their integrations</p>
        </div>
        <button onClick={() => setModal('create')} className="btn-primary" id="add-client-btn">
          <Plus className="w-4 h-4" />
          Add Client
        </button>
      </div>

      {/* Client grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card p-6 h-48 animate-pulse bg-slate-800" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients?.map((client) => (
            <div key={client.id} className="card p-5 hover:border-slate-700 transition-all duration-200 group animate-fade-in">
              {/* Color bar */}
              <div className="h-2 -mx-5 -mt-5 mb-4 rounded-t-2xl"
                style={{ background: `linear-gradient(to right, ${client.primaryColor}, ${client.secondaryColor})` }} />

              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0"
                    style={{ background: `linear-gradient(135deg, ${client.primaryColor}, ${client.secondaryColor})` }}>
                    {client.name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{client.name}</p>
                    <p className="text-xs text-slate-500">/{client.slug}</p>
                  </div>
                </div>
                <span className={`badge ${client.isActive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-700 text-slate-500'}`}>
                  {client.isActive ? 'Active' : 'Off'}
                </span>
              </div>

              <div className="space-y-1.5 mb-4">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Building2 className="w-3 h-3" />
                  {client._count?.adAccounts || 0} ad accounts
                </div>
                {client.email && (
                  <div className="flex items-center gap-2 text-xs text-slate-500 truncate">
                    <Globe className="w-3 h-3 flex-shrink-0" />
                    {client.email}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
                <Link to={`/admin/clients/${client.id}`}
                  className="flex-1 btn-secondary py-1.5 text-xs justify-center">
                  <ArrowRight className="w-3 h-3" /> Dashboard
                </Link>
                <button onClick={() => setModal(client)} className="btn-secondary p-1.5">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleDelete(client)} className="btn-danger p-1.5">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {/* Add client card */}
          <button onClick={() => setModal('create')}
            className="card border-dashed p-6 flex flex-col items-center justify-center gap-3 text-slate-600 hover:text-slate-400 hover:border-slate-600 transition-all duration-200 min-h-[200px]">
            <Plus className="w-8 h-8" />
            <span className="text-sm">Add New Client</span>
          </button>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <ClientModal
          client={modal === 'create' ? undefined : modal}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

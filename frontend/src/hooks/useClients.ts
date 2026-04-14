import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import toast from 'react-hot-toast';

export interface Client {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  isActive: boolean;
  createdAt: string;
  _count?: { users: number; adAccounts: number };
  adAccounts?: { id: string; name: string; metaAccountId: string }[];
  socialAccounts?: { id: string; facebookPageName: string | null; instagramUsername: string | null }[];
}

export function useClients() {
  return useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data } = await api.get('/clients');
      return data.data.clients as Client[];
    },
  });
}

export function useClient(id: string | undefined) {
  return useQuery({
    queryKey: ['client', id],
    queryFn: async () => {
      const { data } = await api.get(`/clients/${id}`);
      return data.data.client as Client;
    },
    enabled: !!id,
  });
}

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<Client>) => api.post('/clients', payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['clients'] }); toast.success('Client created!'); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to create client'),
  });
}

export function useUpdateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: Partial<Client> & { id: string }) => api.put(`/clients/${id}`, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['clients'] }); toast.success('Client updated!'); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to update client'),
  });
}

export function useDeleteClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/clients/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['clients'] }); toast.success('Client deleted'); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to delete'),
  });
}

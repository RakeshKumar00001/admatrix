import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Download, Plus, Loader2, CheckCircle, XCircle, Clock, Trash2 } from 'lucide-react';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { useClients } from '../hooks/useClients';
import { formatDate } from '../lib/utils';
import toast from 'react-hot-toast';

interface Report {
  id: string;
  title: string;
  periodStart: string;
  periodEnd: string;
  reportType: string;
  status: 'pending' | 'generating' | 'ready' | 'failed';
  fileUrl: string | null;
  createdAt: string;
}

function StatusBadge({ status }: { status: Report['status'] }) {
  const map = {
    ready: { icon: <CheckCircle className="w-3 h-3" />, cls: 'bg-emerald-500/15 text-emerald-400' },
    generating: { icon: <Loader2 className="w-3 h-3 animate-spin" />, cls: 'bg-brand-500/15 text-brand-400' },
    pending: { icon: <Clock className="w-3 h-3" />, cls: 'bg-slate-700 text-slate-400' },
    failed: { icon: <XCircle className="w-3 h-3" />, cls: 'bg-rose-500/15 text-rose-400' },
  };
  const { icon, cls } = map[status] || map.pending;
  return (
    <span className={`badge flex items-center gap-1.5 ${cls}`}>
      {icon} {status}
    </span>
  );
}

export default function ReportsPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const { data: clients } = useClients();

  const [selectedClient, setSelectedClient] = useState(user?.clientId || '');
  const [generating, setGenerating] = useState(false);
  const [genForm, setGenForm] = useState({ startDate: '', endDate: '', reportType: 'monthly' });

  const clientId = isAdmin ? selectedClient : user?.clientId;

  const qc = useQueryClient();

  const { data: reports, isLoading } = useQuery({
    queryKey: ['reports', clientId],
    queryFn: async () => {
      const { data } = await api.get('/reports', { params: { clientId } });
      return data.data.reports as Report[];
    },
    enabled: !!clientId,
    refetchInterval: generating ? 3000 : false,
  });

  const deleteReport = useMutation({
    mutationFn: (id: string) => api.delete(`/reports/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['reports'] }); toast.success('Report deleted'); },
  });

  const handleGenerate = async () => {
    if (!clientId || !genForm.startDate || !genForm.endDate) {
      toast.error('Please select client, start date and end date');
      return;
    }
    setGenerating(true);
    try {
      await api.post('/reports/generate', { clientId, ...genForm });
      toast.success('Report generation started!');
      qc.invalidateQueries({ queryKey: ['reports'] });
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (report: Report) => {
    try {
      const response = await api.get(`/reports/${report.id}/download`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report.title}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download report');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Reports</h1>
          <p className="text-slate-400 text-sm mt-0.5">Generate and download PDF performance reports</p>
        </div>
      </div>

      {/* Generate panel */}
      <div className="card p-6">
        <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-brand-400" /> Generate New Report
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {isAdmin && (
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="input-field"
            >
              <option value="">Select client…</option>
              {clients?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
          <div>
            <input type="date" className="input-field" value={genForm.startDate}
              onChange={(e) => setGenForm(f => ({ ...f, startDate: e.target.value }))} placeholder="Start date" />
          </div>
          <div>
            <input type="date" className="input-field" value={genForm.endDate}
              onChange={(e) => setGenForm(f => ({ ...f, endDate: e.target.value }))} placeholder="End date" />
          </div>
          <select className="input-field" value={genForm.reportType}
            onChange={(e) => setGenForm(f => ({ ...f, reportType: e.target.value }))}>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="custom">Custom</option>
          </select>
        </div>
        <button onClick={handleGenerate} disabled={generating} className="btn-primary mt-4" id="generate-report-btn">
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
          {generating ? 'Generating…' : 'Generate PDF Report'}
        </button>
      </div>

      {/* Reports list */}
      <div className="card">
        <div className="px-6 py-4 border-b border-slate-800">
          <h2 className="font-semibold text-white">Report History</h2>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-slate-800 rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <div className="divide-y divide-slate-800/50">
            {reports?.map((report) => (
              <div key={report.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-800/20 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-brand-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white text-sm">{report.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {formatDate(report.periodStart)} → {formatDate(report.periodEnd)} · Generated {formatDate(report.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={report.status} />
                  {report.status === 'ready' && (
                    <button onClick={() => handleDownload(report)} className="btn-primary py-1.5 px-3 text-xs" id={`download-${report.id}`}>
                      <Download className="w-3.5 h-3.5" /> Download PDF
                    </button>
                  )}
                  {isAdmin && (
                    <button onClick={() => deleteReport.mutate(report.id)} className="btn-danger p-1.5">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {(!reports || reports.length === 0) && (
              <div className="px-6 py-12 text-center text-slate-500">
                <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>No reports yet. Generate your first report above.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

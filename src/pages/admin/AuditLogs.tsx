/**
 * AuditLogs — Read-only audit trail viewer with search, filters, and CSV export.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ScrollText, Search, Download, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { auditLogService, type AuditLogEntry } from '@/api/services/audit-log.service';
import { apiClient } from '@/api/client';
import toast from 'react-hot-toast';

function JsonCell({ value }: { value: any }) {
  const [expanded, setExpanded] = useState(false);
  if (!value) return <span className="text-neutral-300">—</span>;
  const str = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  if (str.length < 40) return <span className="text-[11px] font-mono text-neutral-600 break-all">{str}</span>;
  return (
    <div>
      <button onClick={() => setExpanded(!expanded)} className="text-[11px] text-terra-600 hover:underline">
        {expanded ? 'Collapse' : 'View JSON'}
      </button>
      {expanded && (
        <pre className="mt-1 p-2 bg-neutral-50 rounded text-[10px] font-mono text-neutral-700 max-h-[200px] overflow-auto whitespace-pre-wrap break-all">
          {str}
        </pre>
      )}
    </div>
  );
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [entityType, setEntityType] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const perPage = 20;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { limit: 500 };
      if (entityType) params.entity_type = entityType;
      if (actionFilter) params.action = actionFilter;
      const data = await auditLogService.list(params);
      setLogs(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load audit logs');
    }
    setLoading(false);
  }, [entityType, actionFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Client-side search filter
  const filtered = useMemo(() => {
    if (!search.trim()) return logs;
    const q = search.toLowerCase();
    return logs.filter(l =>
      l.action?.toLowerCase().includes(q) ||
      l.entity_type?.toLowerCase().includes(q) ||
      l.description?.toLowerCase().includes(q) ||
      String(l.entity_id).includes(q)
    );
  }, [logs, search]);

  const paged = useMemo(() => {
    const start = (page - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, page]);
  const totalPages = Math.ceil(filtered.length / perPage);

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const res = await apiClient.get('/api/v1/audit-logs/export/csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('CSV exported');
    } catch {
      toast.error('Export failed');
    }
    setExporting(false);
  };

  const entityTypes = useMemo(() => [...new Set(logs.map(l => l.entity_type).filter(Boolean))], [logs]);
  const actions = useMemo(() => [...new Set(logs.map(l => l.action).filter(Boolean))], [logs]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-terra-50 rounded-xl flex items-center justify-center">
            <ScrollText size={20} className="text-terra-600" />
          </div>
          <div>
            <h1 className="text-[18px] font-bold text-neutral-900">Audit Logs</h1>
            <p className="text-[12px] text-neutral-500">{filtered.length} entries</p>
          </div>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2 text-[13px] font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 disabled:opacity-50"
        >
          <Download size={16} />
          {exporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            placeholder="Search logs..."
            className="w-full pl-9 pr-4 py-2 text-[13px] border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terra-500/30"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className="px-3 py-2 text-[13px] border border-neutral-200 rounded-lg bg-white focus:outline-none"
          value={entityType}
          onChange={e => { setEntityType(e.target.value); setPage(1); }}
        >
          <option value="">All Entities</option>
          {entityTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select
          className="px-3 py-2 text-[13px] border border-neutral-200 rounded-lg bg-white focus:outline-none"
          value={actionFilter}
          onChange={e => { setActionFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Actions</option>
          {actions.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        {(search || entityType || actionFilter) && (
          <button onClick={() => { setSearch(''); setEntityType(''); setActionFilter(''); setPage(1); }} className="p-2 rounded-lg hover:bg-neutral-100">
            <X size={16} className="text-neutral-400" />
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50/50">
                {['Timestamp', 'User ID', 'Action', 'Entity Type', 'Entity ID', 'Description', 'Old Value', 'New Value', 'IP'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-[13px] text-neutral-400">
                  <div className="flex justify-center"><div className="w-6 h-6 border-2 border-neutral-200 border-t-terra-500 rounded-full animate-spin" /></div>
                </td></tr>
              ) : paged.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-[13px] text-neutral-400">No audit logs found</td></tr>
              ) : paged.map(log => (
                <tr key={log.id} className="border-b border-neutral-100 hover:bg-neutral-50/50">
                  <td className="px-4 py-3 text-[11px] text-neutral-500 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-[12px] text-neutral-600">{log.user_id ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[12px] text-neutral-700 font-medium">{log.entity_type}</td>
                  <td className="px-4 py-3 text-[12px] text-neutral-600 font-mono">{log.entity_id ?? '—'}</td>
                  <td className="px-4 py-3 text-[12px] text-neutral-600 max-w-[200px] truncate">{log.description || '—'}</td>
                  <td className="px-4 py-3"><JsonCell value={log.old_value} /></td>
                  <td className="px-4 py-3"><JsonCell value={log.new_value} /></td>
                  <td className="px-4 py-3 text-[11px] text-neutral-400 font-mono">{log.ip_address || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200">
            <p className="text-[12px] text-neutral-500">
              Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="p-1.5 rounded-lg hover:bg-neutral-100 disabled:opacity-30">
                <ChevronLeft size={16} />
              </button>
              <span className="px-2 text-[12px] text-neutral-600">{page}/{totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="p-1.5 rounded-lg hover:bg-neutral-100 disabled:opacity-30">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

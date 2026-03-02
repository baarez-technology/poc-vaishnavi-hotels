/**
 * AuditLogs — Read-only audit trail viewer with search, filters, and CSV export.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ScrollText, Download, X } from 'lucide-react';
import { auditLogService, type AuditLogEntry } from '@/api/services/audit-log.service';
import { apiClient } from '@/api/client';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui2/Button';
import { Badge } from '@/components/ui2/Badge';
import { SearchBar } from '@/components/ui2/SearchBar';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  TableEmpty, TableSkeleton, Pagination,
} from '@/components/ui2/Table';

/* ── FilterSelect (matches Bookings pattern) ─────────────────────────────── */
function FilterSelect({ value, onChange, options, placeholder }: {
  value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; placeholder: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(opt => opt.value === value);
  const displayLabel = !value || value === 'all' ? placeholder : selectedOption?.label;
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`h-9 px-2.5 sm:px-3.5 rounded-lg text-xs sm:text-[13px] bg-white border transition-all duration-150 flex items-center gap-1.5 sm:gap-2 focus:outline-none w-full sm:min-w-[140px] ${
          isOpen
            ? 'border-terra-400 ring-2 ring-terra-500/10'
            : value && value !== 'all'
              ? 'border-terra-300 bg-terra-50'
              : 'border-neutral-200 hover:border-neutral-300'
        }`}
      >
        <span className={value && value !== 'all' ? 'text-terra-700 font-medium' : 'text-neutral-500'}>
          {displayLabel}
        </span>
        <svg className={`w-4 h-4 ml-auto transition-transform ${isOpen ? 'rotate-180' : ''} ${value && value !== 'all' ? 'text-terra-500' : 'text-neutral-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute z-50 w-full mt-1 bg-white rounded-lg border border-neutral-200 shadow-lg overflow-hidden min-w-[160px] max-h-[240px] overflow-y-auto">
            {options.map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => { onChange(option.value); setIsOpen(false); }}
                className={`w-full px-3.5 py-2.5 text-[13px] text-left hover:bg-neutral-50 transition-colors flex items-center justify-between ${
                  value === option.value ? 'bg-terra-50 text-terra-700' : 'text-neutral-700'
                }`}
              >
                {option.label}
                {value === option.value && (
                  <svg className="w-4 h-4 text-terra-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ── JSON Cell (expandable) ──────────────────────────────────────────────── */
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
        <pre className="mt-1 p-2 bg-neutral-50 rounded-xl text-[10px] font-mono text-neutral-700 max-h-[200px] overflow-auto whitespace-pre-wrap break-all">
          {str}
        </pre>
      )}
    </div>
  );
}

/* ── Action badge variant ────────────────────────────────────────────────── */
function actionVariant(action: string): 'info' | 'success' | 'danger' | 'warning' | 'neutral' {
  if (action?.includes('create') || action?.includes('add')) return 'success';
  if (action?.includes('delete') || action?.includes('remove')) return 'danger';
  if (action?.includes('update') || action?.includes('edit')) return 'warning';
  return 'info';
}

/* ── Main Page ───────────────────────────────────────────────────────────── */
export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [entityType, setEntityType] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const perPage = 20;
  const { success, error } = useToast();

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { limit: 500 };
      if (entityType !== 'all') params.entity_type = entityType;
      if (actionFilter !== 'all') params.action = actionFilter;
      const data = await auditLogService.list(params);
      setLogs(Array.isArray(data) ? data : []);
    } catch {
      error('Failed to load audit logs');
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
      success('CSV exported');
    } catch {
      error('Export failed');
    }
    setExporting(false);
  };

  const entityTypes = useMemo(() => [...new Set(logs.map(l => l.entity_type).filter(Boolean))], [logs]);
  const actions = useMemo(() => [...new Set(logs.map(l => l.action).filter(Boolean))], [logs]);

  const entityOptions = [{ value: 'all', label: 'All Entities' }, ...entityTypes.map(t => ({ value: t, label: t }))];
  const actionOptions = [{ value: 'all', label: 'All Actions' }, ...actions.map(a => ({ value: a, label: a }))];

  const hasActiveFilters = search || entityType !== 'all' || actionFilter !== 'all';

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9F7F7' }}>
      <div className="px-4 sm:px-6 lg:px-10 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-neutral-900">Audit Logs</h1>
            <p className="text-[12px] sm:text-[13px] text-neutral-500 mt-1">
              {filtered.length} entr{filtered.length !== 1 ? 'ies' : 'y'} total
            </p>
          </div>
          <Button
            variant="outline"
            icon={Download}
            onClick={handleExportCSV}
            disabled={exporting}
            loading={exporting}
          >
            {exporting ? 'Exporting...' : 'Export CSV'}
          </Button>
        </div>

        {/* Card */}
        <div className="bg-white rounded-[10px] overflow-hidden">
          {/* Filter bar */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 bg-neutral-50/30 border-b border-neutral-100">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="sm:flex-1 sm:max-w-md w-full">
                <SearchBar
                  value={search}
                  onChange={v => { setSearch(v); setPage(1); }}
                  onClear={() => setSearch('')}
                  placeholder="Search logs..."
                  size="sm"
                />
              </div>
              <div className="hidden sm:block sm:flex-1" />
              <FilterSelect
                value={entityType}
                onChange={v => { setEntityType(v); setPage(1); }}
                options={entityOptions}
                placeholder="Entity"
              />
              <FilterSelect
                value={actionFilter}
                onChange={v => { setActionFilter(v); setPage(1); }}
                options={actionOptions}
                placeholder="Action"
              />
              {hasActiveFilters && (
                <button
                  onClick={() => { setSearch(''); setEntityType('all'); setActionFilter('all'); setPage(1); }}
                  className="h-9 px-2 sm:px-3 flex items-center gap-1 sm:gap-1.5 text-xs sm:text-[13px] font-medium text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Clear</span>
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity Type</TableHead>
                  <TableHead>Entity ID</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Old Value</TableHead>
                  <TableHead>New Value</TableHead>
                  <TableHead>IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableSkeleton columns={9} rows={5} />
                ) : paged.length === 0 ? (
                  <TableEmpty
                    colSpan={9}
                    icon={ScrollText}
                    title="No audit logs found"
                    description={hasActiveFilters ? 'Try adjusting your search or filters' : 'Audit logs will appear here as actions are performed'}
                  />
                ) : paged.map(log => (
                  <TableRow key={log.id}>
                    <TableCell className="text-neutral-500 whitespace-nowrap text-[11px]">
                      {new Date(log.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-neutral-600">{log.user_id ?? '—'}</TableCell>
                    <TableCell>
                      <Badge variant={actionVariant(log.action)}>{log.action}</Badge>
                    </TableCell>
                    <TableCell className="font-medium text-neutral-700">{log.entity_type}</TableCell>
                    <TableCell className="font-mono text-neutral-600">{log.entity_id ?? '—'}</TableCell>
                    <TableCell className="text-neutral-600 max-w-[200px] truncate">{log.description || '—'}</TableCell>
                    <TableCell><JsonCell value={log.old_value} /></TableCell>
                    <TableCell><JsonCell value={log.new_value} /></TableCell>
                    <TableCell className="text-neutral-400 font-mono text-[11px]">{log.ip_address || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {!loading && totalPages > 0 && (
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-neutral-100 bg-neutral-50/30">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={filtered.length}
                itemsPerPage={perPage}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

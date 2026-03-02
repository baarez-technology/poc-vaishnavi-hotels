/**
 * AuditPackPage — Night audit evaluation & sign-off chain.
 * 3-panel view: sign-off chain, pre-audit report, post-audit report.
 */

import { useState, useCallback } from 'react';
import {
  ClipboardCheck, CheckCircle, XCircle, Clock, Download, FileBarChart, BarChart3,
} from 'lucide-react';
import { auditPackService, type ApprovalStatus, type AuditSignOff } from '@/api/services/audit-pack.service';
import { frontdeskService } from '@/api/services/frontdesk.service';
import toast from 'react-hot-toast';

const ROLE_ORDER = ['duty_manager', 'general_manager', 'finance_controller'];
const ROLE_LABELS: Record<string, string> = {
  duty_manager: 'Duty Manager',
  general_manager: 'General Manager',
  finance_controller: 'Finance Controller',
};

function SignOffCard({ signOff, isNext, onApprove, onReject }: {
  signOff: AuditSignOff; isNext: boolean;
  onApprove: (role: string) => void; onReject: (role: string) => void;
}) {
  const [comments, setComments] = useState('');

  const statusColors: Record<string, string> = {
    pending: 'border-neutral-200 bg-neutral-50',
    approved: 'border-emerald-300 bg-emerald-50',
    rejected: 'border-red-300 bg-red-50',
  };

  const statusIcon = signOff.status === 'approved'
    ? <CheckCircle size={20} className="text-emerald-500" />
    : signOff.status === 'rejected'
    ? <XCircle size={20} className="text-red-500" />
    : <Clock size={20} className="text-neutral-400" />;

  return (
    <div className={`rounded-xl border-2 p-5 ${statusColors[signOff.status] || statusColors.pending}`}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[11px] text-neutral-500 uppercase tracking-wider">Step {signOff.sign_order}</p>
          <h3 className="text-[14px] font-semibold text-neutral-900">{ROLE_LABELS[signOff.role] || signOff.role}</h3>
        </div>
        {statusIcon}
      </div>

      {signOff.status === 'approved' && (
        <div className="space-y-1 text-[12px]">
          {signOff.staff_name && <p><span className="text-neutral-500">Signed by:</span> {signOff.staff_name}</p>}
          {signOff.signed_at && <p><span className="text-neutral-500">At:</span> {new Date(signOff.signed_at).toLocaleString()}</p>}
          {signOff.comments && <p className="text-neutral-600 mt-1">"{signOff.comments}"</p>}
        </div>
      )}

      {signOff.status === 'rejected' && (
        <div className="space-y-1 text-[12px]">
          {signOff.staff_name && <p><span className="text-neutral-500">Rejected by:</span> {signOff.staff_name}</p>}
          {signOff.comments && <p className="text-red-600 mt-1">"{signOff.comments}"</p>}
        </div>
      )}

      {signOff.status === 'pending' && isNext && (
        <div className="space-y-3 mt-3">
          <textarea
            placeholder="Comments (optional)..."
            value={comments}
            onChange={e => setComments(e.target.value)}
            className="w-full px-3 py-2 text-[12px] border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terra-500/30 min-h-[50px]"
          />
          <div className="flex gap-2">
            <button
              onClick={() => { onApprove(signOff.role); setComments(''); }}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-[12px] font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700"
            >
              <CheckCircle size={14} /> Approve
            </button>
            <button
              onClick={() => { onReject(signOff.role); setComments(''); }}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-[12px] font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
            >
              <XCircle size={14} /> Reject
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ReportSection({ title, data }: { title: string; data: any }) {
  if (!data) return <p className="text-[13px] text-neutral-400">No data available</p>;

  return (
    <div className="space-y-4">
      <h3 className="text-[14px] font-semibold text-neutral-900">{title}</h3>
      {typeof data === 'object' && !Array.isArray(data) ? (
        <div className="space-y-3">
          {Object.entries(data).map(([key, value]) => (
            <div key={key} className="bg-neutral-50 rounded-lg p-4">
              <h4 className="text-[12px] font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                {key.replace(/_/g, ' ')}
              </h4>
              {typeof value === 'object' && value !== null ? (
                <div className="space-y-1">
                  {Object.entries(value as Record<string, any>).map(([k, v]) => (
                    <div key={k} className="flex justify-between text-[12px]">
                      <span className="text-neutral-600">{k.replace(/_/g, ' ')}</span>
                      <span className="font-medium text-neutral-900">
                        {typeof v === 'number' ? v.toLocaleString() : String(v)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[13px] font-medium text-neutral-900">
                  {typeof value === 'number' ? value.toLocaleString() : String(value)}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <pre className="bg-neutral-50 rounded-lg p-4 text-[11px] font-mono overflow-auto max-h-[400px] whitespace-pre-wrap">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default function AuditPackPage() {
  const [auditId, setAuditId] = useState('');
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus | null>(null);
  const [preReport, setPreReport] = useState<any>(null);
  const [postReport, setPostReport] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'signoffs' | 'pre' | 'post'>('signoffs');
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const loadAudit = useCallback(async () => {
    const id = parseInt(auditId);
    if (!id) { toast.error('Enter a valid audit ID'); return; }
    setLoading(true);
    try {
      const [approvals, pre, post] = await Promise.allSettled([
        auditPackService.getApprovals(id),
        auditPackService.getPreReport(id),
        auditPackService.getPostReport(id),
      ]);
      setApprovalStatus(approvals.status === 'fulfilled' ? approvals.value : null);
      setPreReport(pre.status === 'fulfilled' ? pre.value : null);
      setPostReport(post.status === 'fulfilled' ? post.value : null);
    } catch {
      toast.error('Failed to load audit pack');
    }
    setLoading(false);
  }, [auditId]);

  const handleSignOff = async (role: string) => {
    const id = parseInt(auditId);
    if (!id) return;
    try {
      await auditPackService.signOff(id, role);
      toast.success(`${ROLE_LABELS[role] || role} approved`);
      loadAudit();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Sign-off failed');
    }
  };

  const handleReject = async (role: string) => {
    const id = parseInt(auditId);
    if (!id) return;
    try {
      await auditPackService.reject(id, role);
      toast.success(`${ROLE_LABELS[role] || role} rejected`);
      loadAudit();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Rejection failed');
    }
  };

  const handleExport = async () => {
    const id = parseInt(auditId);
    if (!id) return;
    setExporting(true);
    try {
      const res = await auditPackService.exportPdf(id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-pack-${id}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Export downloaded');
    } catch {
      toast.error('Export failed');
    }
    setExporting(false);
  };

  const signOffs = approvalStatus?.approvals || [];
  const sortedSignOffs = [...signOffs].sort((a, b) => a.sign_order - b.sign_order);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-terra-50 rounded-xl flex items-center justify-center">
            <ClipboardCheck size={20} className="text-terra-600" />
          </div>
          <div>
            <h1 className="text-[18px] font-bold text-neutral-900">Audit Pack</h1>
            <p className="text-[12px] text-neutral-500">Night audit evaluation & sign-off chain</p>
          </div>
        </div>
        {approvalStatus && (
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 text-[13px] font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 disabled:opacity-50"
          >
            <Download size={16} />
            {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
        )}
      </div>

      {/* Audit Selector */}
      <div className="flex items-center gap-3">
        <input
          type="number"
          placeholder="Enter Audit ID..."
          value={auditId}
          onChange={e => setAuditId(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && loadAudit()}
          className="px-3 py-2 text-[13px] border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terra-500/30 w-48"
        />
        <button
          onClick={loadAudit}
          disabled={loading}
          className="px-4 py-2 text-[13px] font-medium text-white bg-terra-600 rounded-lg hover:bg-terra-700 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Load Audit'}
        </button>
      </div>

      {/* Status Banner */}
      {approvalStatus && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-medium ${
          approvalStatus.fully_approved
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
            : 'bg-blue-50 border border-blue-200 text-blue-700'
        }`}>
          {approvalStatus.fully_approved ? (
            <><CheckCircle size={18} /> Fully approved — Audit #{approvalStatus.audit_id} ({approvalStatus.audit_date})</>
          ) : (
            <><Clock size={18} /> Audit #{approvalStatus.audit_id} ({approvalStatus.audit_date}) — Status: {approvalStatus.approval_status}
              {approvalStatus.next_pending_role && ` — Next: ${ROLE_LABELS[approvalStatus.next_pending_role] || approvalStatus.next_pending_role}`}</>
          )}
        </div>
      )}

      {/* Tabs */}
      {approvalStatus && (
        <div className="flex gap-1 border-b border-neutral-200">
          {[
            { key: 'signoffs' as const, label: 'Sign-off Chain', icon: ClipboardCheck },
            { key: 'pre' as const, label: 'Pre-Audit Report', icon: FileBarChart },
            { key: 'post' as const, label: 'Post-Audit Report', icon: BarChart3 },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-terra-600 text-terra-700'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
              }`}
            >
              <tab.icon size={15} />
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Tab Content */}
      {approvalStatus && activeTab === 'signoffs' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sortedSignOffs.length > 0 ? sortedSignOffs.map(so => (
            <SignOffCard
              key={so.id}
              signOff={so}
              isNext={approvalStatus.next_pending_role === so.role}
              onApprove={handleSignOff}
              onReject={handleReject}
            />
          )) : (
            <div className="col-span-3 bg-white rounded-xl border border-neutral-200 p-8 text-center">
              <p className="text-[13px] text-neutral-400">No sign-offs found. Sign-offs are auto-created after night audit completes.</p>
            </div>
          )}
        </div>
      )}

      {approvalStatus && activeTab === 'pre' && (
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <ReportSection title="Pre-Audit Report" data={preReport} />
        </div>
      )}

      {approvalStatus && activeTab === 'post' && (
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <ReportSection title="Post-Audit Report" data={postReport} />
        </div>
      )}

      {/* Empty state */}
      {!approvalStatus && !loading && (
        <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
          <ClipboardCheck size={40} className="text-neutral-300 mx-auto mb-3" />
          <p className="text-[14px] text-neutral-600 mb-1">Enter an Audit ID to view the evaluation pack</p>
          <p className="text-[12px] text-neutral-400">Audit IDs are generated after a night audit is completed</p>
        </div>
      )}
    </div>
  );
}

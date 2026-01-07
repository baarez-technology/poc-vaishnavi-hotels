import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Send,
  Plus,
  Edit2,
  Trash2,
  X,
  Mail,
  MessageSquare,
  Bell,
  Calendar,
  Users,
  Eye,
  Play,
  Pause,
  BarChart2
} from 'lucide-react';
import { generateId, formatDate, CAMPAIGN_TYPES, CAMPAIGN_STATUS } from '../../utils/crm';
import CustomDropdown from '../ui/CustomDropdown';

const CAMPAIGN_TYPE_OPTIONS = CAMPAIGN_TYPES.map(type => ({
  value: type.id,
  label: `${type.icon} ${type.name}`
}));

const CAMPAIGN_STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' }
];

function CampaignModal({ isOpen, onClose, onSave, campaign, mode, segments, templates }) {
  const [formData, setFormData] = useState({
    name: campaign?.name || '',
    type: campaign?.type || 'email',
    status: campaign?.status || 'draft',
    segmentId: campaign?.segmentId || '',
    templateId: campaign?.templateId || '',
    subject: campaign?.subject || '',
    scheduleDate: campaign?.scheduleDate || ''
  });

  const selectedSegment = segments.find(s => s.id === formData.segmentId);
  const filteredTemplates = templates.filter(t => t.type === formData.type);

  // ESC key handler and body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const handleSubmit = () => {
    if (!formData.name.trim() || !formData.segmentId) return;

    const campaignData = {
      id: campaign?.id || generateId(),
      name: formData.name.trim(),
      type: formData.type,
      status: formData.status,
      segmentId: formData.segmentId,
      segmentName: selectedSegment?.name || '',
      templateId: formData.templateId,
      subject: formData.subject.trim(),
      scheduleDate: formData.scheduleDate || null,
      metrics: campaign?.metrics || {
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0
      },
      createdAt: campaign?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSave(campaignData);
    onClose();
  };

  if (!isOpen) return null;

  const segmentOptions = [
    { value: '', label: 'Select a segment...' },
    ...segments.map(seg => ({
      value: seg.id,
      label: `${seg.name} (${seg.guestCount || 0} guests)`
    }))
  ];

  const templateOptions = [
    { value: '', label: 'Select a template...' },
    ...filteredTemplates.map(tmpl => ({
      value: tmpl.id,
      label: tmpl.name
    }))
  ];

  const modalContent = (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-[60]"
        onClick={onClose}
      />

      {/* Centered Modal */}
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div
          className="w-full max-w-lg max-h-[90vh] bg-white shadow-2xl rounded-2xl flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex-shrink-0 p-6 border-b border-neutral-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-neutral-900">
                  {mode === 'create' ? 'Create Campaign' : 'Edit Campaign'}
                </h2>
                <p className="text-sm text-neutral-500">Configure campaign settings</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div>
              <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2 block">Campaign Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Holiday Season Promotion"
                className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#A57865]/20 focus:border-[#A57865]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2 block">Type</label>
                <CustomDropdown
                  options={CAMPAIGN_TYPE_OPTIONS}
                  value={formData.type}
                  onChange={(value) => setFormData(prev => ({ ...prev, type: value, templateId: '' }))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2 block">Status</label>
                <CustomDropdown
                  options={CAMPAIGN_STATUS_OPTIONS}
                  value={formData.status}
                  onChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                  className="w-full"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2 block">Target Segment *</label>
              <CustomDropdown
                options={segmentOptions}
                value={formData.segmentId}
                onChange={(value) => setFormData(prev => ({ ...prev, segmentId: value }))}
                className="w-full"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2 block">Message Template</label>
              <CustomDropdown
                options={templateOptions}
                value={formData.templateId}
                onChange={(value) => setFormData(prev => ({ ...prev, templateId: value }))}
                className="w-full"
              />
            </div>

            {formData.type === 'email' && (
              <div>
                <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2 block">Subject Line</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Email subject..."
                  className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#A57865]/20 focus:border-[#A57865]"
                />
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2 block">Schedule Date</label>
              <input
                type="datetime-local"
                value={formData.scheduleDate}
                onChange={(e) => setFormData(prev => ({ ...prev, scheduleDate: e.target.value }))}
                className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#A57865]/20 focus:border-[#A57865]"
              />
            </div>

            {selectedSegment && (
              <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200">
                <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-3">Target Audience</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center">
                    <p className="text-xl font-bold text-[#A57865]">{selectedSegment.guestCount || 0}</p>
                    <p className="text-xs text-neutral-500">Recipients</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-[#4E5840]">${(selectedSegment.avgRevenue || 0).toLocaleString()}</p>
                    <p className="text-xs text-neutral-500">Avg LTV</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 border-t border-neutral-200 p-4 bg-white rounded-b-2xl">
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-neutral-200 text-neutral-700 rounded-xl text-sm font-medium hover:bg-neutral-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!formData.name.trim() || !formData.segmentId}
                className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  formData.name.trim() && formData.segmentId
                    ? 'bg-[#4E5840] text-white hover:bg-[#3d4632]'
                    : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                }`}
              >
                {mode === 'create' ? 'Create Campaign' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
}

export default function CRMTabCampaigns({ campaigns, segments, templates, onSave, onDelete }) {
  const [modalState, setModalState] = useState({ isOpen: false, campaign: null, mode: 'create' });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [filter, setFilter] = useState('all');

  const filteredCampaigns = campaigns.filter(c => filter === 'all' || c.status === filter);

  const handleCreateCampaign = () => {
    setModalState({ isOpen: true, campaign: null, mode: 'create' });
  };

  const handleEditCampaign = (campaign) => {
    setModalState({ isOpen: true, campaign, mode: 'edit' });
  };

  const handleSaveCampaign = (campaignData) => {
    if (modalState.mode === 'create') {
      onSave([...campaigns, campaignData]);
    } else {
      onSave(campaigns.map(c => c.id === campaignData.id ? campaignData : c));
    }
  };

  const handleDeleteCampaign = (campaignId) => {
    onDelete(campaignId);
    setDeleteConfirm(null);
  };

  const handleToggleStatus = (campaign) => {
    const newStatus = campaign.status === 'active' ? 'paused' : 'active';
    const updatedCampaign = { ...campaign, status: newStatus, updatedAt: new Date().toISOString() };
    onSave(campaigns.map(c => c.id === campaign.id ? updatedCampaign : c));
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'email':
        return <Mail className="w-5 h-5 text-[#4E5840]" />;
      case 'sms':
        return <MessageSquare className="w-5 h-5 text-[#5C9BA4]" />;
      case 'push':
        return <Bell className="w-5 h-5 text-[#CDB261]" />;
      default:
        return <Send className="w-5 h-5 text-neutral-500" />;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#4E5840]/10 flex items-center justify-center">
            <Send className="w-5 h-5 text-[#4E5840]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-neutral-900">Campaigns</h3>
            <p className="text-sm text-neutral-500">{campaigns.length} campaigns</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <CustomDropdown
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'draft', label: 'Draft' },
              { value: 'scheduled', label: 'Scheduled' },
              { value: 'active', label: 'Active' },
              { value: 'completed', label: 'Completed' },
              { value: 'paused', label: 'Paused' }
            ]}
            value={filter}
            onChange={setFilter}
            className="[&_button]:min-w-[120px]"
          />
          <button
            onClick={handleCreateCampaign}
            className="flex items-center gap-2 px-4 py-2 bg-[#A57865] text-white rounded-lg text-sm font-medium hover:bg-[#A57865]/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Campaign
          </button>
        </div>
      </div>

      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
        {filteredCampaigns.map((campaign) => {
          const statusConfig = CAMPAIGN_STATUS[campaign.status] || CAMPAIGN_STATUS.draft;
          const metrics = campaign.metrics || {};
          const openRate = metrics.sent > 0 ? Math.round((metrics.opened / metrics.sent) * 100) : 0;
          const clickRate = metrics.opened > 0 ? Math.round((metrics.clicked / metrics.opened) * 100) : 0;

          return (
            <div
              key={campaign.id}
              className="border border-neutral-200 rounded-xl p-4 hover:border-[#A57865]/30 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center">
                    {getTypeIcon(campaign.type)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-neutral-900">{campaign.name}</h4>
                    <div className="flex items-center gap-2 text-xs text-neutral-500 mt-0.5">
                      <span className={`px-2 py-0.5 rounded-full ${statusConfig.bgColor} ${statusConfig.textColor}`}>
                        {statusConfig.label}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {campaign.segmentName}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {(campaign.status === 'active' || campaign.status === 'paused') && (
                    <button
                      onClick={() => handleToggleStatus(campaign)}
                      className={`p-2 rounded-lg transition-colors ${
                        campaign.status === 'active'
                          ? 'hover:bg-[#CDB261]/10 text-[#CDB261]'
                          : 'hover:bg-[#4E5840]/10 text-[#4E5840]'
                      }`}
                      title={campaign.status === 'active' ? 'Pause' : 'Resume'}
                    >
                      {campaign.status === 'active' ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => handleEditCampaign(campaign)}
                    className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4 text-neutral-500" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(campaign.id)}
                    className="p-2 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-rose-500" />
                  </button>
                </div>
              </div>

              {/* Schedule Info */}
              {campaign.scheduleDate && (
                <div className="flex items-center gap-2 text-xs text-neutral-600 mb-3">
                  <Calendar className="w-3 h-3" />
                  Scheduled: {formatDate(campaign.scheduleDate)}
                </div>
              )}

              {/* Metrics */}
              {(campaign.status === 'active' || campaign.status === 'completed') && (
                <div className="grid grid-cols-4 gap-2 bg-neutral-50 rounded-lg p-3">
                  <div className="text-center">
                    <p className="text-lg font-bold text-neutral-900">{metrics.sent || 0}</p>
                    <p className="text-xs text-neutral-500">Sent</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-neutral-900">{metrics.delivered || 0}</p>
                    <p className="text-xs text-neutral-500">Delivered</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-[#4E5840]">{openRate}%</p>
                    <p className="text-xs text-neutral-500">Open Rate</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-[#5C9BA4]">{clickRate}%</p>
                    <p className="text-xs text-neutral-500">Click Rate</p>
                  </div>
                </div>
              )}

              {deleteConfirm === campaign.id && (
                <div className="mt-3 pt-3 border-t border-neutral-100 bg-rose-50 -mx-4 -mb-4 p-4 rounded-b-xl">
                  <p className="text-sm text-rose-800 mb-2">Delete this campaign?</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDeleteCampaign(campaign.id)}
                      className="px-3 py-1.5 bg-rose-600 text-white text-xs font-medium rounded-lg hover:bg-rose-700 transition-colors"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-200 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredCampaigns.length === 0 && (
          <div className="text-center py-8">
            <p className="text-neutral-500">No campaigns found</p>
            <button
              onClick={handleCreateCampaign}
              className="mt-2 text-sm text-[#A57865] hover:underline"
            >
              Create your first campaign
            </button>
          </div>
        )}
      </div>

      <CampaignModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, campaign: null, mode: 'create' })}
        onSave={handleSaveCampaign}
        campaign={modalState.campaign}
        mode={modalState.mode}
        segments={segments}
        templates={templates}
      />
    </div>
  );
}

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  FileText,
  Plus,
  Edit2,
  Trash2,
  X,
  Mail,
  MessageSquare,
  Copy,
  Check,
  Info
} from 'lucide-react';
import { generateId, formatDate, PERSONALIZATION_TAGS } from '../../utils/crm';
import CustomDropdown from '../ui/CustomDropdown';

const TEMPLATE_TYPE_OPTIONS = [
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS' }
];

function TemplateModal({ isOpen, onClose, onSave, template, mode }) {
  const [formData, setFormData] = useState({
    name: template?.name || '',
    type: template?.type || 'email',
    subject: template?.subject || '',
    body: template?.body || ''
  });

  const [showTagsHelp, setShowTagsHelp] = useState(false);

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
    if (!formData.name.trim() || !formData.body.trim()) return;
    if (formData.type === 'email' && !formData.subject.trim()) return;

    const templateData = {
      id: template?.id || generateId(),
      name: formData.name.trim(),
      type: formData.type,
      subject: formData.type === 'email' ? formData.subject.trim() : null,
      body: formData.body.trim(),
      createdAt: template?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSave(templateData);
    onClose();
  };

  const insertTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      body: prev.body + tag
    }));
  };

  if (!isOpen) return null;

  const isValid = formData.name.trim() && formData.body.trim() && (formData.type !== 'email' || formData.subject.trim());

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
          className="w-full max-w-2xl max-h-[90vh] bg-white shadow-2xl rounded-2xl flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex-shrink-0 p-6 border-b border-neutral-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-neutral-900">
                  {mode === 'create' ? 'Create Template' : 'Edit Template'}
                </h2>
                <p className="text-sm text-neutral-500">
                  {formData.type === 'email' ? 'Email template' : 'SMS template'}
                </p>
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2 block">Template Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Welcome Email"
                  className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#A57865]/20 focus:border-[#A57865]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2 block">Type</label>
                <CustomDropdown
                  options={TEMPLATE_TYPE_OPTIONS}
                  value={formData.type}
                  onChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                  className="w-full"
                />
              </div>
            </div>

            {formData.type === 'email' && (
              <div>
                <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2 block">Subject Line *</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="e.g., Welcome to Glimmora, {{guest.firstName}}!"
                  className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#A57865]/20 focus:border-[#A57865]"
                />
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Message Body *</label>
                <button
                  onClick={() => setShowTagsHelp(!showTagsHelp)}
                  className="flex items-center gap-1 text-xs text-[#5C9BA4] hover:text-[#5C9BA4]/80"
                >
                  <Info className="w-3 h-3" />
                  Personalization Tags
                </button>
              </div>

              {showTagsHelp && (
                <div className="mb-2 p-3 bg-[#5C9BA4]/5 border border-[#5C9BA4]/20 rounded-xl">
                  <p className="text-xs text-neutral-600 mb-2">Click to insert:</p>
                  <div className="flex flex-wrap gap-1">
                    {PERSONALIZATION_TAGS.map(({ tag, description }) => (
                      <button
                        key={tag}
                        onClick={() => insertTag(tag)}
                        title={description}
                        className="px-2 py-1 text-xs bg-white border border-neutral-200 rounded-lg hover:bg-[#5C9BA4]/10 hover:border-[#5C9BA4] transition-colors"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <textarea
                value={formData.body}
                onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
                placeholder="Write your message here..."
                rows={formData.type === 'email' ? 10 : 4}
                className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#A57865]/20 focus:border-[#A57865] resize-none font-mono"
              />
              {formData.type === 'sms' && (
                <p className="text-xs text-neutral-500 mt-1">
                  {formData.body.length}/160 characters
                </p>
              )}
            </div>
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
                disabled={!isValid}
                className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isValid
                    ? 'bg-[#4E5840] text-white hover:bg-[#3d4632]'
                    : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                }`}
              >
                {mode === 'create' ? 'Create Template' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
}

export default function TemplateCenter({ templates, onSave, onDelete }) {
  const [modalState, setModalState] = useState({ isOpen: false, template: null, mode: 'create' });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [filter, setFilter] = useState('all');
  const [copiedId, setCopiedId] = useState(null);

  const filteredTemplates = templates.filter(t => filter === 'all' || t.type === filter);

  const handleCreateTemplate = () => {
    setModalState({ isOpen: true, template: null, mode: 'create' });
  };

  const handleEditTemplate = (template) => {
    setModalState({ isOpen: true, template, mode: 'edit' });
  };

  const handleSaveTemplate = (templateData) => {
    if (modalState.mode === 'create') {
      onSave([...templates, templateData]);
    } else {
      onSave(templates.map(t => t.id === templateData.id ? templateData : t));
    }
  };

  const handleDeleteTemplate = (templateId) => {
    onDelete(templateId);
    setDeleteConfirm(null);
  };

  const handleCopyBody = (template) => {
    navigator.clipboard.writeText(template.body);
    setCopiedId(template.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#5C9BA4]/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-[#5C9BA4]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-neutral-900">Template Center</h3>
            <p className="text-sm text-neutral-500">{templates.length} templates</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <CustomDropdown
            options={[
              { value: 'all', label: 'All Types' },
              { value: 'email', label: 'Email' },
              { value: 'sms', label: 'SMS' }
            ]}
            value={filter}
            onChange={setFilter}
            className="[&_button]:min-w-[110px]"
          />
          <button
            onClick={handleCreateTemplate}
            className="flex items-center gap-2 px-4 py-2 bg-[#A57865] text-white rounded-lg text-sm font-medium hover:bg-[#A57865]/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Template
          </button>
        </div>
      </div>

      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            className="border border-neutral-200 rounded-xl p-4 hover:border-[#A57865]/30 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-3">
                {template.type === 'email' ? (
                  <div className="w-10 h-10 rounded-lg bg-[#4E5840]/10 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-[#4E5840]" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-[#5C9BA4]/10 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-[#5C9BA4]" />
                  </div>
                )}
                <div>
                  <h4 className="font-semibold text-neutral-900">{template.name}</h4>
                  <div className="flex items-center gap-2 text-xs text-neutral-500">
                    <span className={`px-2 py-0.5 rounded-full ${
                      template.type === 'email'
                        ? 'bg-[#4E5840]/10 text-[#4E5840]'
                        : 'bg-[#5C9BA4]/10 text-[#5C9BA4]'
                    }`}>
                      {template.type.toUpperCase()}
                    </span>
                    <span>Updated {formatDate(template.updatedAt)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleCopyBody(template)}
                  className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                  title="Copy body"
                >
                  {copiedId === template.id ? (
                    <Check className="w-4 h-4 text-[#4E5840]" />
                  ) : (
                    <Copy className="w-4 h-4 text-neutral-500" />
                  )}
                </button>
                <button
                  onClick={() => handleEditTemplate(template)}
                  className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4 text-neutral-500" />
                </button>
                <button
                  onClick={() => setDeleteConfirm(template.id)}
                  className="p-2 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-rose-500" />
                </button>
              </div>
            </div>

            {template.subject && (
              <p className="text-sm font-medium text-neutral-700 mb-1">
                Subject: {template.subject}
              </p>
            )}

            <p className="text-sm text-neutral-600 line-clamp-2">
              {template.body}
            </p>

            {deleteConfirm === template.id && (
              <div className="mt-3 pt-3 border-t border-neutral-100 bg-rose-50 -mx-4 -mb-4 p-4 rounded-b-xl">
                <p className="text-sm text-rose-800 mb-2">Delete this template?</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDeleteTemplate(template.id)}
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
        ))}

        {filteredTemplates.length === 0 && (
          <div className="text-center py-8">
            <p className="text-neutral-500">No templates found</p>
            <button
              onClick={handleCreateTemplate}
              className="mt-2 text-sm text-[#A57865] hover:underline"
            >
              Create your first template
            </button>
          </div>
        )}
      </div>

      <TemplateModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, template: null, mode: 'create' })}
        onSave={handleSaveTemplate}
        template={modalState.template}
        mode={modalState.mode}
      />
    </div>
  );
}

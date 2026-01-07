import { useState, useRef, useEffect } from 'react';
import { Plus, Play, RefreshCw, Zap, ChevronDown, Check } from 'lucide-react';
import { useRMS } from '../../../context/RMSContext';
import RuleCard, { RuleSummary } from '../../../components/revenue-management/RuleCard';
import RuleEditorDrawer from '../../../components/revenue-management/RuleEditorDrawer';
import { Button } from '../../../components/ui2/Button';
import { ConfirmModal } from '../../../components/ui2/Modal';

const PricingRules = () => {
  const {
    rules,
    ruleAnalytics,
    runAllRules,
    deleteRule,
  } = useRMS();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [filterActive, setFilterActive] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [isActiveDropdownOpen, setIsActiveDropdownOpen] = useState(false);
  const [isPriorityDropdownOpen, setIsPriorityDropdownOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, rule: null });
  const [selectedRule, setSelectedRule] = useState(null);

  const activeDropdownRef = useRef(null);
  const priorityDropdownRef = useRef(null);

  const handleRunAllRules = async () => {
    setIsRunning(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const results = runAllRules();
      console.log('Rules applied:', results);
    } finally {
      setIsRunning(false);
    }
  };

  const handleCreateRule = () => {
    setEditingRule(null);
    setIsDrawerOpen(true);
  };

  const handleEditRule = (rule) => {
    setEditingRule(rule);
    setIsDrawerOpen(true);
  };

  const handleDeleteRule = (rule) => {
    setDeleteConfirm({ isOpen: true, rule });
  };

  const confirmDelete = () => {
    if (deleteConfirm.rule) {
      deleteRule(deleteConfirm.rule.id);
    }
    setDeleteConfirm({ isOpen: false, rule: null });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeDropdownRef.current && !activeDropdownRef.current.contains(event.target)) {
        setIsActiveDropdownOpen(false);
      }
      if (priorityDropdownRef.current && !priorityDropdownRef.current.contains(event.target)) {
        setIsPriorityDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredRules = rules.filter(rule => {
    if (filterActive === 'active' && !rule.isActive) return false;
    if (filterActive === 'inactive' && rule.isActive) return false;
    if (filterPriority !== 'all' && rule.priority !== parseInt(filterPriority)) return false;
    return true;
  });

  const sortedRules = [...filteredRules].sort((a, b) => a.priority - b.priority);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9F7F7' }}>
      <main className="px-10 py-6 space-y-6">
        {/* Header */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
              Pricing Rules Engine
            </h1>
            <p className="text-[13px] text-neutral-500 mt-1">
              Configure automated pricing rules based on conditions
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 p-1 rounded-lg bg-neutral-100">
              {[
                { value: 'all', label: 'All' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFilterActive(option.value)}
                  className={`px-4 py-1.5 rounded-lg text-[13px] font-semibold transition-all duration-200 ${
                    filterActive === option.value
                      ? 'bg-white text-neutral-900 shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-900 hover:bg-white/50'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <Button
              onClick={handleRunAllRules}
              loading={isRunning}
              icon={isRunning ? RefreshCw : Play}
              variant="outline"
            >
              {isRunning ? 'Running...' : 'Run All'}
            </Button>
            <Button
              onClick={handleCreateRule}
              icon={Plus}
              variant="primary"
            >
              Create Rule
            </Button>
          </div>
        </header>

        {/* Summary Stats */}
        <section>
          <RuleSummary rules={rules} />
        </section>

        {/* Priority Filter */}
        <section className="rounded-[10px] bg-white overflow-hidden">
          <div className="px-6 py-5 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-neutral-800">Filter by Priority</h3>
              <p className="text-[11px] text-neutral-400 font-medium mt-0.5">
                Select priority level to filter rules
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilterPriority('all')}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
                  filterPriority === 'all'
                    ? 'bg-terra-500 text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                All
              </button>
              {[1, 2, 3, 4, 5].map(p => (
                <button
                  key={p}
                  onClick={() => setFilterPriority(String(p))}
                  className={`w-9 h-9 rounded-lg text-[12px] font-bold transition-all ${
                    filterPriority === String(p)
                      ? p === 1 ? 'bg-rose-500 text-white'
                      : p === 2 ? 'bg-gold-500 text-white'
                      : p === 3 ? 'bg-ocean-500 text-white'
                      : 'bg-neutral-600 text-white'
                      : p === 1 ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                      : p === 2 ? 'bg-gold-100 text-gold-700 hover:bg-gold-200'
                      : p === 3 ? 'bg-ocean-100 text-ocean-700 hover:bg-ocean-200'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  P{p}
                </button>
              ))}
            </div>
          </div>
          <div className="px-6 pb-5">
            <p className="text-[12px] text-neutral-500">
              Showing <span className="font-semibold text-neutral-800">{filteredRules.length}</span> of {rules.length} rules
            </p>
          </div>
        </section>

        {/* Rules Grid */}
        <section>
          {sortedRules.length === 0 ? (
            <div className="rounded-[10px] bg-white p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-5 rounded-lg flex items-center justify-center bg-terra-50">
                <Zap className="w-8 h-8 text-terra-500" />
              </div>
              <h3 className="font-semibold text-[15px] mb-1 text-neutral-900">
                No Rules Found
              </h3>
              <p className="text-[13px] mb-6 max-w-md mx-auto text-neutral-500">
                {filterActive !== 'all' || filterPriority !== 'all'
                  ? 'No rules match the current filters'
                  : 'Create your first pricing rule to automate rate adjustments'}
              </p>
              {filterActive === 'all' && filterPriority === 'all' && (
                <Button onClick={handleCreateRule} variant="primary" icon={Plus}>
                  Create Your First Rule
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {sortedRules.map(rule => (
                <RuleCard
                  key={rule.id}
                  rule={rule}
                  onEdit={handleEditRule}
                  onDelete={handleDeleteRule}
                  isSelected={selectedRule === rule.id}
                  onClick={() => setSelectedRule(selectedRule === rule.id ? null : rule.id)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Rule Editor Drawer */}
        <RuleEditorDrawer
          isOpen={isDrawerOpen}
          onClose={() => {
            setIsDrawerOpen(false);
            setEditingRule(null);
          }}
          rule={editingRule}
          onSave={() => {
            setIsDrawerOpen(false);
            setEditingRule(null);
          }}
        />

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          open={deleteConfirm.isOpen}
          onClose={() => setDeleteConfirm({ isOpen: false, rule: null })}
          onConfirm={confirmDelete}
          title="Delete Rule"
          description={`Are you sure you want to delete "${deleteConfirm.rule?.name}"? This action cannot be undone.`}
          variant="danger"
          confirmText="Delete"
          cancelText="Cancel"
        />
      </main>
    </div>
  );
};

export default PricingRules;

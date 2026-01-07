import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { defaultSettings } from '../../utils/settings';
import AddFeeModal from './AddFeeModal';
import EditFeeModal from './EditFeeModal';
import { Button } from '../ui2/Button';

const STORAGE_KEY = 'glimmora_fees';

const defaultFees = [
  { id: 'fee-001', name: 'Room Tax (GST)', type: 'percentage', value: 12, description: 'GST on room charges' },
  { id: 'fee-002', name: 'Service Charge', type: 'percentage', value: 10, description: 'Service charge on total bill' },
  { id: 'fee-003', name: 'City Tax', type: 'percentage', value: 5, description: 'Municipal tax' },
  { id: 'fee-004', name: 'Extra Guest Fee', type: 'fixed', value: 1500, description: 'Per extra guest per night' },
  { id: 'fee-005', name: 'Cleaning Fee', type: 'fixed', value: 500, description: 'Deep cleaning charge' },
  { id: 'fee-006', name: 'Resort Fee', type: 'fixed', value: 2000, description: 'Access to resort amenities' }
];

export default function TaxesTab() {
  const [fees, setFees] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingFee, setEditingFee] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Load fees from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setFees(JSON.parse(stored));
    } else {
      setFees(defaultFees);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultFees));
    }
  }, []);

  // Save fees to localStorage
  const saveFees = (newFees) => {
    setFees(newFees);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newFees));
  };

  const handleAddFee = (newFee) => {
    const feeWithId = {
      ...newFee,
      id: `fee-${Date.now()}`
    };
    saveFees([...fees, feeWithId]);
    setShowAddModal(false);
  };

  const handleEditFee = (updatedFee) => {
    saveFees(fees.map((f) => (f.id === updatedFee.id ? updatedFee : f)));
    setEditingFee(null);
  };

  const handleDeleteFee = (id) => {
    saveFees(fees.filter((f) => f.id !== id));
    setDeleteConfirm(null);
  };

  const formatValue = (fee) => {
    if (fee.type === 'percentage') {
      return `${fee.value}%`;
    }
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(fee.value);
  };

  const percentageFees = fees.filter((f) => f.type === 'percentage');
  const fixedFees = fees.filter((f) => f.type === 'fixed');

  return (
    <div className="max-w-4xl space-y-8">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-neutral-900">Taxes & Fees</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Configure taxes and additional charges applied to bookings
          </p>
        </div>
        <Button variant="primary" icon={Plus} onClick={() => setShowAddModal(true)}>
          Add Tax / Fee
        </Button>
      </header>

      {/* Percentage-based Taxes */}
      <section className="bg-neutral-50/50 rounded-[10px] overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100">
          <h2 className="text-[13px] font-semibold text-neutral-800">Percentage-based Taxes</h2>
          <p className="text-[11px] text-neutral-500 mt-0.5">Applied as a percentage of the total amount</p>
        </div>

        {percentageFees.length > 0 ? (
          <div className="p-6">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="text-left pb-3 text-[13px] font-medium text-neutral-600">Name</th>
                  <th className="text-left pb-3 text-[13px] font-medium text-neutral-600">Description</th>
                  <th className="text-right pb-3 text-[13px] font-medium text-neutral-600">Rate</th>
                  <th className="text-right pb-3 text-[13px] font-medium text-neutral-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {percentageFees.map((fee, index) => (
                  <tr key={fee.id} className={index !== percentageFees.length - 1 ? 'border-b border-neutral-100' : ''}>
                    <td className="py-3">
                      <span className="text-sm font-medium text-neutral-900">{fee.name}</span>
                    </td>
                    <td className="py-3">
                      <span className="text-sm text-neutral-500">{fee.description}</span>
                    </td>
                    <td className="py-3 text-right">
                      <span className="text-sm font-medium text-neutral-900">{fee.value}%</span>
                    </td>
                    <td className="py-3 text-right">
                      {deleteConfirm === fee.id ? (
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            icon={X}
                            onClick={() => setDeleteConfirm(null)}
                          />
                          <Button
                            variant="danger"
                            size="sm"
                            icon={Check}
                            onClick={() => handleDeleteFee(fee.id)}
                          />
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={Pencil}
                            onClick={() => setEditingFee(fee)}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={Trash2}
                            onClick={() => setDeleteConfirm(fee.id)}
                          />
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6">
            <div className="py-12 text-center">
              <p className="text-sm text-neutral-500">No percentage-based taxes configured</p>
            </div>
          </div>
        )}
      </section>

      {/* Fixed Fees */}
      <section className="bg-neutral-50/50 rounded-[10px] overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100">
          <h2 className="text-[13px] font-semibold text-neutral-800">Fixed Fees</h2>
          <p className="text-[11px] text-neutral-500 mt-0.5">Flat rate charges applied to bookings</p>
        </div>

        {fixedFees.length > 0 ? (
          <div className="p-6">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="text-left pb-3 text-[13px] font-medium text-neutral-600">Name</th>
                  <th className="text-left pb-3 text-[13px] font-medium text-neutral-600">Description</th>
                  <th className="text-right pb-3 text-[13px] font-medium text-neutral-600">Amount</th>
                  <th className="text-right pb-3 text-[13px] font-medium text-neutral-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {fixedFees.map((fee, index) => (
                  <tr key={fee.id} className={index !== fixedFees.length - 1 ? 'border-b border-neutral-100' : ''}>
                    <td className="py-3">
                      <span className="text-sm font-medium text-neutral-900">{fee.name}</span>
                    </td>
                    <td className="py-3">
                      <span className="text-sm text-neutral-500">{fee.description}</span>
                    </td>
                    <td className="py-3 text-right">
                      <span className="text-sm font-medium text-neutral-900">{formatValue(fee)}</span>
                    </td>
                    <td className="py-3 text-right">
                      {deleteConfirm === fee.id ? (
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            icon={X}
                            onClick={() => setDeleteConfirm(null)}
                          />
                          <Button
                            variant="danger"
                            size="sm"
                            icon={Check}
                            onClick={() => handleDeleteFee(fee.id)}
                          />
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={Pencil}
                            onClick={() => setEditingFee(fee)}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={Trash2}
                            onClick={() => setDeleteConfirm(fee.id)}
                          />
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6">
            <div className="py-12 text-center">
              <p className="text-sm text-neutral-500">No fixed fees configured</p>
            </div>
          </div>
        )}
      </section>

      {/* Modals */}
      {showAddModal && (
        <AddFeeModal
          onClose={() => setShowAddModal(false)}
          onSave={handleAddFee}
        />
      )}

      {editingFee && (
        <EditFeeModal
          fee={editingFee}
          onClose={() => setEditingFee(null)}
          onSave={handleEditFee}
        />
      )}
    </div>
  );
}

/**
 * GuestsTable Component
 * Table for guests - Glimmora Design System v5.0
 * Matches BookingsTable styling exactly
 */

import { ChevronUp, ChevronDown, ChevronsUpDown, Users } from 'lucide-react';
import GuestRow from './GuestRow';

export default function GuestsTable({ guests, sortField, sortDirection, onSort, onGuestClick, onEditGuest, onMessageGuest, onDeleteGuest }) {
  const SortIndicator = ({ field }) => {
    const sorted = sortField === field ? sortDirection : null;
    const Icon = sorted === 'asc' ? ChevronUp : sorted === 'desc' ? ChevronDown : ChevronsUpDown;
    return <Icon className={`w-3.5 h-3.5 ${sorted ? 'text-terra-500' : 'text-neutral-300'}`} />;
  };

  const columns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email', sortable: false },
    { key: 'country', label: 'Country', sortable: true },
    { key: 'lastStay', label: 'Last Stay', sortable: true },
    { key: 'totalStays', label: 'Stays', sortable: true },
    { key: 'emotion', label: 'Emotion', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'actions', label: 'Actions', sortable: false }
  ];

  return (
    <div className="overflow-x-auto max-w-full">
      <table className="w-full min-w-[1100px] border-collapse">
        <colgroup>
          <col style={{ width: '180px' }} />
          <col style={{ width: '220px' }} />
          <col style={{ width: '120px' }} />
          <col style={{ width: '130px' }} />
          <col style={{ width: '80px' }} />
          <col style={{ width: '100px' }} />
          <col style={{ width: '120px' }} />
          <col style={{ width: '150px' }} />
        </colgroup>
        <thead>
          <tr className="bg-neutral-50/30 border-b border-neutral-100">
            {columns.map((column) => (
              <th
                key={column.key}
                onClick={() => column.sortable && onSort(column.key)}
                className={`text-left px-6 py-4 text-[10px] font-semibold text-neutral-400 uppercase tracking-widest whitespace-nowrap ${
                  column.sortable ? 'cursor-pointer hover:text-neutral-600' : ''
                }`}
              >
                <span className="flex items-center gap-1.5">
                  {column.label}
                  {column.sortable && <SortIndicator field={column.key} />}
                </span>
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-neutral-100">
          {(!guests || guests.length === 0) ? (
            <tr>
              <td colSpan={8} className="px-6 py-16 text-center">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-lg bg-terra-50 flex items-center justify-center mb-4">
                    <Users className="w-5 h-5 text-terra-500" />
                  </div>
                  <p className="text-[13px] font-semibold text-neutral-800 mb-1">
                    No guests found
                  </p>
                  <p className="text-[11px] text-neutral-500 font-medium">
                    Try adjusting your filters or search query
                  </p>
                </div>
              </td>
            </tr>
          ) : (
            guests.map((guest) => (
              <GuestRow
                key={guest.id}
                guest={guest}
                onClick={onGuestClick}
                onEdit={onEditGuest}
                onMessage={onMessageGuest}
                onDelete={onDeleteGuest}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

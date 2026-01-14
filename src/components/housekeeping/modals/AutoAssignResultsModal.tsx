/**
 * AutoAssignResultsModal Component
 * Shows detailed results after auto-assignment - Glimmora Design System v5.0
 * Displays which rooms were assigned to which staff members
 */

import { CheckCircle2, XCircle, User, BedDouble, Sparkles, ArrowRight } from 'lucide-react';
import { Drawer } from '../../ui2/Drawer';
import { Button } from '../../ui2/Button';

interface AssignmentResult {
  roomNumber: string;
  roomId?: number;
  staffName: string;
  staffId?: number;
  score?: number;
  success?: boolean;
  message?: string;
}

interface AutoAssignResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  results: {
    success: boolean;
    totalAssigned: number;
    totalFailed?: number;
    assignments: AssignmentResult[];
    staffAssignments: Record<string, string[]>;
    message?: string;
  } | null;
}

export default function AutoAssignResultsModal({
  isOpen,
  onClose,
  results
}: AutoAssignResultsModalProps) {
  if (!results) return null;

  const { totalAssigned, totalFailed = 0, assignments, staffAssignments } = results;

  // Group assignments by staff for display
  const staffGroups = Object.entries(staffAssignments || {});

  // Custom header
  const renderHeader = () => (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-sage-100 flex items-center justify-center">
        <Sparkles className="w-5 h-5 text-sage-600" />
      </div>
      <div className="flex-1 min-w-0">
        <h2 className="text-lg font-semibold text-neutral-900 tracking-tight">
          Auto-Assignment Complete
        </h2>
        <p className="text-[13px] text-neutral-500 mt-0.5">
          {totalAssigned} task{totalAssigned !== 1 ? 's' : ''} assigned successfully
          {totalFailed > 0 && `, ${totalFailed} failed`}
        </p>
      </div>
    </div>
  );

  // Footer
  const renderFooter = () => (
    <div className="flex items-center justify-between w-full">
      <p className="text-[12px] text-neutral-500">
        Tasks can be reviewed in the Housekeeping table
      </p>
      <Button variant="primary" size="md" onClick={onClose}>
        Done
      </Button>
    </div>
  );

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      header={renderHeader()}
      footer={renderFooter()}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-sage-50 border border-sage-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-sage-100 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-sage-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-sage-700">{totalAssigned}</p>
                <p className="text-[11px] font-medium text-sage-600 uppercase tracking-wide">Assigned</p>
              </div>
            </div>
          </div>
          {totalFailed > 0 && (
            <div className="p-4 rounded-lg bg-rose-50 border border-rose-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-rose-700">{totalFailed}</p>
                  <p className="text-[11px] font-medium text-rose-600 uppercase tracking-wide">Failed</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Assignment Details by Staff */}
        {staffGroups.length > 0 && (
          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-widest text-neutral-900 mb-3">
              Assignment Details
            </h4>
            <div className="space-y-3">
              {staffGroups.map(([staffName, rooms]) => (
                <div
                  key={staffName}
                  className="p-4 rounded-lg bg-neutral-50 border border-neutral-100 hover:border-neutral-200 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    {/* Staff Avatar */}
                    <div className="w-10 h-10 rounded-full bg-terra-100 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-terra-600" />
                    </div>

                    {/* Staff Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-[14px] font-semibold text-neutral-900">
                          {staffName}
                        </p>
                        <span className="px-2 py-0.5 rounded-full bg-terra-100 text-terra-700 text-[10px] font-semibold">
                          {rooms.length} room{rooms.length !== 1 ? 's' : ''}
                        </span>
                      </div>

                      {/* Rooms List */}
                      <div className="flex flex-wrap gap-2">
                        {rooms.map((room) => (
                          <div
                            key={room}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white border border-neutral-200"
                          >
                            <BedDouble className="w-3.5 h-3.5 text-neutral-400" />
                            <span className="text-[12px] font-medium text-neutral-700">
                              {room}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Arrow indicator */}
                    <ArrowRight className="w-4 h-4 text-neutral-300 flex-shrink-0 mt-3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Individual Assignment Details (if needed for debugging) */}
        {assignments.length > 0 && staffGroups.length === 0 && (
          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-widest text-neutral-900 mb-3">
              All Assignments
            </h4>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {assignments.map((assignment, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3 rounded-lg bg-neutral-50 border border-neutral-100"
                >
                  <div className="w-8 h-8 rounded-lg bg-terra-100 flex items-center justify-center">
                    <BedDouble className="w-4 h-4 text-terra-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[13px] font-medium text-neutral-900">
                      {assignment.roomNumber}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-neutral-300" />
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-neutral-400" />
                    <span className="text-[13px] font-medium text-neutral-700">
                      {assignment.staffName}
                    </span>
                  </div>
                  {assignment.score && (
                    <span className="px-2 py-0.5 rounded-full bg-sage-100 text-sage-700 text-[10px] font-semibold">
                      Score: {assignment.score}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No assignments message */}
        {totalAssigned === 0 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
              <BedDouble className="w-8 h-8 text-neutral-400" />
            </div>
            <p className="text-[14px] font-medium text-neutral-600">
              No tasks were assigned
            </p>
            <p className="text-[12px] text-neutral-500 mt-1">
              {results.message || 'All rooms may already be assigned or no staff available'}
            </p>
          </div>
        )}

        {/* Tip for reviewing */}
        <div className="p-4 rounded-lg bg-ocean-50 border border-ocean-100">
          <p className="text-[12px] text-ocean-700">
            <strong>Tip:</strong> You can review and manage all assigned tasks in the Housekeeping table.
            Filter by "Status" or use the "By Staff" tab to see assignments grouped by housekeeper.
          </p>
        </div>
      </div>
    </Drawer>
  );
}

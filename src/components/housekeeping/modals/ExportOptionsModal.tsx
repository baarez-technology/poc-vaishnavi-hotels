/**
 * ExportOptionsModal Component
 * Export format selection modal - Glimmora Design System v5.0
 * Allows users to choose between CSV and PDF export formats
 */

import { Download, FileSpreadsheet, FileText, X } from 'lucide-react';
import { Button } from '../../ui2/Button';

interface ExportOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExportCSV: () => void;
  onExportPDF: () => void;
}

export default function ExportOptionsModal({
  isOpen,
  onClose,
  onExportCSV,
  onExportPDF
}: ExportOptionsModalProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-terra-50 flex items-center justify-center">
                <Download className="w-5 h-5 text-terra-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-neutral-900 tracking-tight">
                  Export Data
                </h2>
                <p className="text-[12px] text-neutral-500">
                  Choose your preferred format
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4">
              {/* CSV Option */}
              <button
                onClick={() => {
                  onExportCSV();
                  onClose();
                }}
                className="p-5 rounded-xl border border-neutral-200 hover:border-terra-300 hover:bg-terra-50/50 transition-all duration-200 group text-left"
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-sage-50 group-hover:bg-sage-100 flex items-center justify-center transition-colors">
                    <FileSpreadsheet className="w-6 h-6 text-sage-600" />
                  </div>
                  <div className="text-center">
                    <span className="text-[14px] font-semibold text-neutral-800 block">
                      CSV File
                    </span>
                    <span className="text-[11px] text-neutral-500 mt-1 block">
                      Spreadsheet format for Excel
                    </span>
                  </div>
                </div>
              </button>

              {/* PDF Option */}
              <button
                onClick={() => {
                  onExportPDF();
                  onClose();
                }}
                className="p-5 rounded-xl border border-neutral-200 hover:border-terra-300 hover:bg-terra-50/50 transition-all duration-200 group text-left"
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-terra-50 group-hover:bg-terra-100 flex items-center justify-center transition-colors">
                    <FileText className="w-6 h-6 text-terra-600" />
                  </div>
                  <div className="text-center">
                    <span className="text-[14px] font-semibold text-neutral-800 block">
                      PDF Report
                    </span>
                    <span className="text-[11px] text-neutral-500 mt-1 block">
                      Formatted for printing
                    </span>
                  </div>
                </div>
              </button>
            </div>

            {/* Info text */}
            <p className="text-[11px] text-neutral-400 text-center mt-4">
              CSV includes all data fields. PDF is optimized for printing and sharing.
            </p>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-100">
            <div className="flex justify-end">
              <Button variant="outline-neutral" size="sm" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

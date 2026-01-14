import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({
  currentPage,
  totalPages,
  startIndex,
  endIndex,
  totalItems,
  rowsPerPage,
  canGoPrev,
  canGoNext,
  onPrevPage,
  onNextPage,
  onGoToPage,
  onRowsPerPageChange,
}) {
  const rowsPerPageOptions = [10, 20, 50];

  // Generate visible page numbers
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return { pages, start, end };
  };

  const { pages, start, end } = getPageNumbers();

  return (
    <div className="flex items-center justify-between pt-4">
      {/* Left: Rows per page */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-neutral-600 font-medium">Rows per page:</span>
        <select
          value={rowsPerPage}
          onChange={(e) => onRowsPerPageChange(Number(e.target.value))}
          className="appearance-none h-9 px-3 pr-8 bg-white border border-neutral-200 rounded-lg text-sm font-medium text-neutral-700 hover:border-[#A57865]/30 focus:outline-none focus:ring-2 focus:ring-[#A57865] focus:border-[#A57865] transition-all duration-200 cursor-pointer bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%23525252%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3e%3cpolyline points=%276 9 12 15 18 9%27%3e%3c/polyline%3e%3c/svg%3e')] bg-[length:16px_16px] bg-[right_0.5rem_center] bg-no-repeat"
        >
          {rowsPerPageOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      {/* Center: Page info */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-neutral-600">
          Showing{' '}
          <span className="font-semibold text-neutral-900">
            {startIndex}-{endIndex}
          </span>{' '}
          of{' '}
          <span className="font-semibold text-neutral-900">{totalItems}</span>
        </span>
      </div>

      {/* Right: Page numbers and Navigation buttons */}
      <div className="flex items-center gap-1">
        <button
          onClick={onPrevPage}
          disabled={!canGoPrev}
          className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200 ${
            canGoPrev
              ? 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700'
              : 'text-neutral-300 cursor-not-allowed'
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1 mx-1">
          {start > 1 && (
            <>
              <button
                onClick={() => onGoToPage?.(1)}
                className="w-9 h-9 rounded-lg text-sm font-medium text-neutral-600 hover:bg-neutral-100 transition-colors"
              >
                1
              </button>
              {start > 2 && <span className="px-1 text-neutral-400">...</span>}
            </>
          )}

          {pages.map((page) => (
            <button
              key={page}
              onClick={() => onGoToPage?.(page)}
              className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                currentPage === page
                  ? 'bg-[#A57865] text-white'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              {page}
            </button>
          ))}

          {end < totalPages && (
            <>
              {end < totalPages - 1 && <span className="px-1 text-neutral-400">...</span>}
              <button
                onClick={() => onGoToPage?.(totalPages)}
                className="w-9 h-9 rounded-lg text-sm font-medium text-neutral-600 hover:bg-neutral-100 transition-colors"
              >
                {totalPages}
              </button>
            </>
          )}
        </div>

        <button
          onClick={onNextPage}
          disabled={!canGoNext}
          className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200 ${
            canGoNext
              ? 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700'
              : 'text-neutral-300 cursor-not-allowed'
          }`}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

import { X } from 'lucide-react';
import { SelectDropdown, SearchInput } from '../ui2/Input';
import { Button } from '../ui2/Button';

const SOURCE_OPTIONS = [
  { value: 'all', label: 'All Sources' },
  { value: 'booking.com', label: 'Booking.com' },
  { value: 'google', label: 'Google' },
  { value: 'expedia', label: 'Expedia' },
  { value: 'tripadvisor', label: 'Tripadvisor' },
  { value: 'agoda', label: 'Agoda' }
];

const RATING_OPTIONS = [
  { value: 'all', label: 'All Ratings' },
  { value: '5', label: '5 Stars' },
  { value: '4', label: '4 Stars' },
  { value: '3', label: '3 Stars' },
  { value: '2', label: '2 Stars' },
  { value: '1', label: '1 Star' }
];

const SENTIMENT_OPTIONS = [
  { value: 'all', label: 'All Sentiments' },
  { value: 'positive', label: 'Positive' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'negative', label: 'Negative' }
];

interface FiltersBarProps {
  filters: {
    source: string;
    rating: string;
    sentimentRange: string;
    dateRange: string;
    keyword: string;
  };
  onFilterChange: (filters: any) => void;
}

export default function FiltersBar({ filters, onFilterChange }: FiltersBarProps) {
  const hasActiveFilters = filters.source !== 'all' ||
    filters.rating !== 'all' ||
    filters.sentimentRange !== 'all' ||
    filters.keyword;

  const handleClearFilters = () => {
    onFilterChange({
      source: 'all',
      rating: 'all',
      sentimentRange: 'all',
      dateRange: '30d',
      keyword: ''
    });
  };

  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      {/* Left - Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Source Filter */}
        <div className="w-[140px]">
          <SelectDropdown
            value={filters.source}
            onChange={(value) => onFilterChange({ ...filters, source: value })}
            options={SOURCE_OPTIONS}
            size="md"
          />
        </div>

        {/* Rating Filter */}
        <div className="w-[130px]">
          <SelectDropdown
            value={filters.rating}
            onChange={(value) => onFilterChange({ ...filters, rating: value })}
            options={RATING_OPTIONS}
            size="md"
          />
        </div>

        {/* Sentiment Filter */}
        <div className="w-[150px]">
          <SelectDropdown
            value={filters.sentimentRange}
            onChange={(value) => onFilterChange({ ...filters, sentimentRange: value })}
            options={SENTIMENT_OPTIONS}
            size="md"
          />
        </div>

        {/* Keyword Search */}
        <div className="w-[180px]">
          <SearchInput
            value={filters.keyword}
            onChange={(e) => onFilterChange({ ...filters, keyword: e.target.value })}
            onClear={() => onFilterChange({ ...filters, keyword: '' })}
            placeholder="Search keywords..."
            size="md"
          />
        </div>
      </div>

      {/* Right - Clear Filters */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          icon={X}
          onClick={handleClearFilters}
        >
          Clear
        </Button>
      )}
    </div>
  );
}

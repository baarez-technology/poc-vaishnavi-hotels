import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Search, ChevronDown, Plus, Minus, X } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

interface SearchWidgetProps {
  onSearch: (data: SearchData) => void;
}

export interface SearchData {
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
}

export function RoomsSearchWidget({ onSearch }: SearchWidgetProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showGuestsDropdown, setShowGuestsDropdown] = useState(false);

  const [searchData, setSearchData] = useState<SearchData>({
    checkIn: searchParams.get('checkIn') || '',
    checkOut: searchParams.get('checkOut') || '',
    adults: parseInt(searchParams.get('adults') || '1'),
    children: parseInt(searchParams.get('children') || '0'),
  });

  useEffect(() => {
    // Trigger search when component mounts if dates are present
    if (searchData.checkIn && searchData.checkOut) {
      onSearch(searchData);
    }
  }, []);

  const handleSearch = () => {
    // Update URL params
    const params = new URLSearchParams();
    if (searchData.checkIn) params.set('checkIn', searchData.checkIn);
    if (searchData.checkOut) params.set('checkOut', searchData.checkOut);
    params.set('adults', searchData.adults.toString());
    params.set('children', searchData.children.toString());

    navigate(`/rooms?${params.toString()}`, { replace: true });
    onSearch(searchData);
  };

  const updateGuests = (type: 'adults' | 'children', change: number) => {
    setSearchData(prev => ({
      ...prev,
      [type]: Math.max(type === 'adults' ? 1 : 0, prev[type] + change),
    }));
  };

  const totalGuests = searchData.adults + searchData.children;
  const today = new Date().toISOString().split('T')[0];
  const minCheckOut = searchData.checkIn || today;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-visible"
    >
      {/* Search Form */}
      <div className="space-y-4">
        {/* Check-in Date */}
        <div>
          <label className="block text-xs font-medium text-neutral-700 mb-2">
            Check-In Date
          </label>
          <input
            type="date"
            value={searchData.checkIn}
            onChange={(e) => setSearchData({ ...searchData, checkIn: e.target.value })}
            min={today}
            placeholder="Add Date"
            className="w-full px-3 py-2.5 bg-white rounded-lg text-sm text-neutral-900 border border-neutral-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-all"
          />
        </div>

        {/* Check-out Date */}
        <div>
          <label className="block text-xs font-medium text-neutral-700 mb-2">
            Check-Out Date
          </label>
          <input
            type="date"
            value={searchData.checkOut}
            onChange={(e) => setSearchData({ ...searchData, checkOut: e.target.value })}
            min={minCheckOut}
            placeholder="Add Date"
            className="w-full px-3 py-2.5 bg-white rounded-lg text-sm text-neutral-900 border border-neutral-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-all"
          />
        </div>

        {/* Guests Dropdown */}
        <div className="relative">
          <label className="block text-xs font-medium text-neutral-700 mb-2">
            Guests
          </label>
          <button
            type="button"
            onClick={() => setShowGuestsDropdown(!showGuestsDropdown)}
            className="w-full px-3 py-2.5 text-left bg-white rounded-lg border border-neutral-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-900">
                {totalGuests} {totalGuests === 1 ? 'Guest' : 'Guests'}
              </span>
              <ChevronDown className={`w-4 h-4 text-neutral-600 transition-transform duration-300 ${showGuestsDropdown ? 'rotate-180' : ''}`} />
            </div>
          </button>

            {/* Guests Dropdown Menu */}
            {showGuestsDropdown && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowGuestsDropdown(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 350, damping: 28 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg border-2 border-neutral-300 p-4 z-20"
                >
                  {/* Adults */}
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-neutral-200">
                    <div>
                      <div className="font-medium text-neutral-900 text-sm">Adults</div>
                      <div className="text-xs text-neutral-500 mt-0.5">Age 13+</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <motion.button
                        type="button"
                        onClick={() => updateGuests('adults', -1)}
                        disabled={searchData.adults <= 1}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center hover:border-primary-500 hover:bg-primary-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      >
                        <Minus className="w-3.5 h-3.5 text-neutral-700" />
                      </motion.button>
                      <span className="w-6 text-center font-medium text-neutral-900 text-sm">
                        {searchData.adults}
                      </span>
                      <motion.button
                        type="button"
                        onClick={() => updateGuests('adults', 1)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center hover:border-primary-500 hover:bg-primary-50 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5 text-neutral-700" />
                      </motion.button>
                    </div>
                  </div>

                  {/* Children */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="font-medium text-neutral-900 text-sm">Children</div>
                      <div className="text-xs text-neutral-500 mt-0.5">Age 0-12</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <motion.button
                        type="button"
                        onClick={() => updateGuests('children', -1)}
                        disabled={searchData.children <= 0}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center hover:border-primary-500 hover:bg-primary-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      >
                        <Minus className="w-3.5 h-3.5 text-neutral-700" />
                      </motion.button>
                      <span className="w-6 text-center font-medium text-neutral-900 text-sm">
                        {searchData.children}
                      </span>
                      <motion.button
                        type="button"
                        onClick={() => updateGuests('children', 1)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center hover:border-primary-500 hover:bg-primary-50 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5 text-neutral-700" />
                      </motion.button>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowGuestsDropdown(false)}
                    className="w-full py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-all"
                  >
                    Done
                  </button>
                </motion.div>
              </>
            )}
        </div>

        {/* Search Button */}
        <button
          onClick={handleSearch}
          disabled={!searchData.checkIn || !searchData.checkOut}
          className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
        >
          <Search className="w-4 h-4" />
          <span>Search</span>
        </button>
      </div>

      {/* Active Search Info */}
      {searchData.checkIn && searchData.checkOut && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="pt-4 mt-4 border-t border-neutral-200"
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="text-xs text-neutral-600 flex-1">
              <div className="font-medium text-neutral-900 mb-1">
                {new Date(searchData.checkIn).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                {' - '}
                {new Date(searchData.checkOut).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
              <div>
                {totalGuests} {totalGuests === 1 ? 'guest' : 'guests'}
              </div>
            </div>
            <button
              onClick={() => {
                setSearchData({ checkIn: '', checkOut: '', adults: 1, children: 0 });
                navigate('/rooms', { replace: true });
                onSearch({ checkIn: '', checkOut: '', adults: 1, children: 0 });
              }}
              className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1 hover:bg-primary-50 px-2 py-1 rounded transition-all"
            >
              <X className="w-3 h-3" />
              Clear
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

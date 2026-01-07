import { motion } from 'framer-motion';
import { useState } from 'react';
import { ChevronDown, Plus, Minus, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function HeroSection() {
  const navigate = useNavigate();
  const [searchData, setSearchData] = useState({
    checkIn: '',
    checkOut: '',
    adults: 2,
    children: 0,
  });
  const [showGuestsDropdown, setShowGuestsDropdown] = useState(false);

  return (
    <section className="relative overflow-visible pb-32 sm:pb-40">
      {/* Background - Ends at middle of search card */}
      <div className="absolute inset-x-0 top-0 h-[70vh] overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?q=80&w=2070&auto=format&fit=crop)'
          }}
        />

        {/* Black Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/50 to-black/70" />

        {/* Additional subtle gradient for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/30" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24">
        {/* Hero Content - Two Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center pt-12 pb-16">
          {/* Left Column - Headline */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6">
              Discover Your Perfect Stay. One Search.
            </h1>
          </motion.div>

          {/* Right Column - Promotional Text */}
        <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-white/90 text-lg leading-relaxed"
          >
            <p>
              Experience luxury accommodations with AI-powered recommendations. Book now and save 15% or more when you reserve by January 2025. Not sure where to go? Use our intelligent search to find the perfect hotel for your needs.
            </p>
        </motion.div>
      </div>

        {/* Search Card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="bg-white rounded-2xl shadow-2xl overflow-visible max-w-7xl mx-auto"
        >
          {/* Search Form */}
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Check-in Date */}
              <div>
                <label className="block text-sm font-semibold text-neutral-900 mb-2">
                  Check-In Date
                </label>
                <input
                  type="date"
                  value={searchData.checkIn}
                  onChange={(e) => setSearchData({ ...searchData, checkIn: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  placeholder="Add Date"
                  className="w-full px-4 py-4 bg-neutral-50 rounded-lg text-neutral-900 border border-neutral-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-all"
                />
              </div>

              {/* Check-out Date */}
              <div>
                <label className="block text-sm font-semibold text-neutral-900 mb-2">
                  Check-Out Date
                </label>
                <input
                  type="date"
                  value={searchData.checkOut}
                  onChange={(e) => setSearchData({ ...searchData, checkOut: e.target.value })}
                  min={searchData.checkIn || new Date().toISOString().split('T')[0]}
                  placeholder="Add Date"
                  className="w-full px-4 py-4 bg-neutral-50 rounded-lg text-neutral-900 border border-neutral-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-all"
                />
              </div>

              {/* Guests Dropdown */}
              <div className="relative">
                <label className="block text-sm font-semibold text-neutral-900 mb-2">
                  Travelers & Class
                </label>
                <button
                  type="button"
                  onClick={() => setShowGuestsDropdown(!showGuestsDropdown)}
                  className="w-full px-4 py-4 text-left bg-neutral-50 rounded-lg border border-neutral-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-900">
                      {searchData.adults + searchData.children} {searchData.adults + searchData.children === 1 ? 'Guest' : 'Guests'}
                    </span>
                    <ChevronDown className={`w-5 h-5 text-neutral-600 transition-transform duration-300 ${showGuestsDropdown ? 'rotate-180' : ''}`} />
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
                      className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-[0_20px_48px_rgba(0,0,0,0.15)] border border-neutral-200 p-6 z-20"
                      >
                        {/* Adults */}
                        <div className="flex items-center justify-between mb-5 pb-5 border-b border-neutral-200">
                          <div>
                            <div className="font-semibold text-neutral-900 text-base">Adults</div>
                            <div className="text-sm text-neutral-500 mt-0.5">Age 13+</div>
                          </div>
                          <div className="flex items-center gap-4">
                            <motion.button
                              type="button"
                              onClick={() => setSearchData({ ...searchData, adults: Math.max(1, searchData.adults - 1) })}
                              disabled={searchData.adults <= 1}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="w-9 h-9 rounded-full border-2 border-neutral-300 flex items-center justify-center hover:border-orange-500 hover:bg-orange-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
                            >
                              <Minus className="w-4 h-4 text-neutral-700" />
                            </motion.button>
                            <span className="w-8 text-center font-semibold text-neutral-900 text-lg">
                              {searchData.adults}
                            </span>
                            <motion.button
                              type="button"
                              onClick={() => setSearchData({ ...searchData, adults: searchData.adults + 1 })}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="w-9 h-9 rounded-full border-2 border-neutral-300 flex items-center justify-center hover:border-orange-500 hover:bg-orange-50 transition-all duration-200"
                            >
                              <Plus className="w-4 h-4 text-neutral-700" />
                            </motion.button>
                          </div>
                        </div>

                        {/* Children */}
                        <div className="flex items-center justify-between mb-5">
                          <div>
                            <div className="font-semibold text-neutral-900 text-base">Children</div>
                            <div className="text-sm text-neutral-500 mt-0.5">Age 0-12</div>
                          </div>
                          <div className="flex items-center gap-4">
                            <motion.button
                              type="button"
                              onClick={() => setSearchData({ ...searchData, children: Math.max(0, searchData.children - 1) })}
                              disabled={searchData.children <= 0}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="w-9 h-9 rounded-full border-2 border-neutral-300 flex items-center justify-center hover:border-orange-500 hover:bg-orange-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
                            >
                              <Minus className="w-4 h-4 text-neutral-700" />
                            </motion.button>
                            <span className="w-8 text-center font-semibold text-neutral-900 text-lg">
                              {searchData.children}
                            </span>
                            <motion.button
                              type="button"
                              onClick={() => setSearchData({ ...searchData, children: searchData.children + 1 })}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="w-9 h-9 rounded-full border-2 border-neutral-300 flex items-center justify-center hover:border-orange-500 hover:bg-orange-50 transition-all duration-200"
                            >
                              <Plus className="w-4 h-4 text-neutral-700" />
                            </motion.button>
                          </div>
                        </div>

                      <button
                          onClick={() => setShowGuestsDropdown(false)}
                        className="w-full py-3 bg-primary-500 text-white font-semibold rounded-xl hover:bg-primary-600 transition-all duration-300"
                        >
                          Done
                      </button>
                      </motion.div>
                    </>
                  )}
              </div>

              {/* Search Button */}
              <div className="flex items-end">
                <button
                  onClick={() => {
                    const params = new URLSearchParams();
                    if (searchData.checkIn) params.set('checkIn', searchData.checkIn);
                    if (searchData.checkOut) params.set('checkOut', searchData.checkOut);
                    params.set('adults', searchData.adults.toString());
                    params.set('children', searchData.children.toString());
                    navigate(`/rooms?${params.toString()}`);
                  }}
                  className="w-full px-8 py-5 bg-primary-600 hover:bg-primary-700 text-white font-bold text-lg rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  <Search className="w-5 h-5" />
                  Search Hotels
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

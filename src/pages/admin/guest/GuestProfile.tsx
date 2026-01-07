import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  TrendingUp,
  DollarSign,
  Edit,
  MessageSquare,
  UserX,
  Tag,
  Plus,
  Trash2,
  Award,
  StickyNote,
  Clock,
  Star,
  BarChart3,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { guestsService, GuestFullProfile } from '../../../api/services/guests.service';
import { Loader2 } from 'lucide-react';
import {
  calculateLoyaltyTier,
  LOYALTY_TIERS,
  GUEST_STATUS_CONFIG,
  EMOTION_CONFIG,
  formatDate,
  formatDateTime,
  formatCurrency,
  addNoteToGuest,
  removeNoteFromGuest,
} from '../../../utils/guests';
import MessageGuestModal from '../../../components/admin-panel/guests/MessageGuestModal';

const CHART_COLORS = ['#A57865', '#5C9BA4', '#4E5840', '#CDB261', '#C8B29D'];

// Transform API guest to display format
function transformGuest(apiGuest: GuestFullProfile): any {
  const guestName = `${apiGuest.first_name || ''} ${apiGuest.last_name || ''}`.trim() || 'Unknown Guest';

  // Transform stay_history to history format
  const history = (apiGuest.stay_history || []).map(stay => ({
    date: stay.check_in,
    nights: stay.nights || 1,
    amount: stay.total_spent || 0,
    roomType: stay.room_type || 'Standard',
  }));

  // Transform notes
  const notes = (apiGuest.notes || []).map(note => ({
    id: note.id,
    text: note.text,
    date: note.date,
    author: note.author,
  }));

  return {
    id: String(apiGuest.id),
    name: guestName,
    email: apiGuest.email || '',
    phone: apiGuest.phone || '',
    country: apiGuest.country || 'Unknown',
    status: apiGuest.status || 'Active',
    emotion: apiGuest.emotion || apiGuest.sentiment || 'neutral',
    totalStays: apiGuest.total_bookings || 0,
    totalSpent: apiGuest.total_spent || 0,
    lastStay: apiGuest.last_visit || apiGuest.member_since,
    tags: apiGuest.tags || [],
    preferences: apiGuest.preferences || {},
    history,
    notes,
    vipStatus: apiGuest.vip_status,
    loyaltyTier: apiGuest.loyalty_tier,
  };
}

export default function GuestProfile() {
  const { guestId } = useParams();
  const navigate = useNavigate();
  const [guest, setGuest] = useState<any>(null);
  const [newNote, setNewNote] = useState('');
  const [activeHistoryTab, setActiveHistoryTab] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);

  useEffect(() => {
    const fetchGuest = async () => {
      if (!guestId) {
        setError('No guest ID provided');
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        setError(null);
        // Try getProfile first for full data, fallback to get
        let apiGuest: GuestFullProfile;
        try {
          apiGuest = await guestsService.getProfile(guestId);
        } catch {
          apiGuest = await guestsService.get(guestId) as GuestFullProfile;
        }
        setGuest(transformGuest(apiGuest));
      } catch (err) {
        console.error('Failed to fetch guest:', err);
        setError('Failed to load guest');
      } finally {
        setIsLoading(false);
      }
    };
    fetchGuest();
  }, [guestId]);

  const loyaltyTier = useMemo(() => {
    if (!guest) return 'Bronze';
    return calculateLoyaltyTier(guest.totalStays || 0, guest.totalSpent || 0);
  }, [guest]);

  const tierConfig = LOYALTY_TIERS[loyaltyTier];

  // Calculate spending by year for chart
  const spendingByYear = useMemo(() => {
    if (!guest?.history) return [];
    const yearData = {};
    guest.history.forEach(stay => {
      const year = new Date(stay.date).getFullYear();
      yearData[year] = (yearData[year] || 0) + stay.amount;
    });
    return Object.entries(yearData)
      .map(([year, amount]) => ({ year, amount }))
      .sort((a, b) => a.year - b.year);
  }, [guest]);

  // Calculate room type preferences for pie chart
  const roomTypePreferences = useMemo(() => {
    if (!guest?.history) return [];
    const roomTypes = {};
    guest.history.forEach(stay => {
      const type = stay.roomType || 'Standard';
      roomTypes[type] = (roomTypes[type] || 0) + 1;
    });
    return Object.entries(roomTypes).map(([name, value]) => ({ name, value }));
  }, [guest]);

  // Normalize preferences - extract from nested pre-checkin structure
  // IMPORTANT: This hook must be called before any early returns
  const guestPreferences = useMemo(() => {
    if (!guest?.preferences || typeof guest.preferences !== 'object') return [];

    const prefs: string[] = [];
    const p = guest.preferences;

    // Room preferences (from pre-checkin)
    if (p.room) {
      if (p.room.bedType && p.room.bedType !== 'any') prefs.push(`Bed: ${p.room.bedType}`);
      if (p.room.floor && p.room.floor !== 'any') prefs.push(`Floor: ${p.room.floor}`);
      if (p.room.view && p.room.view !== 'any') prefs.push(`View: ${p.room.view}`);
      if (p.room.quietness && p.room.quietness !== 'any') prefs.push(`Quietness: ${p.room.quietness}`);
    }

    // Legacy format (direct bedType/floor)
    if (p.bedType && !p.room) prefs.push(`Bed: ${p.bedType}`);
    if (p.floor && !p.room) prefs.push(`Floor: ${p.floor}`);

    // Comfort preferences
    if (p.comfort) {
      if (p.comfort.temperature) prefs.push(`Temp: ${p.comfort.temperature}°`);
      if (p.comfort.pillowType && Array.isArray(p.comfort.pillowType) && p.comfort.pillowType.length > 0) {
        prefs.push(`Pillows: ${p.comfort.pillowType.join(', ')}`);
      }
    }

    // Dining preferences
    if (p.dining) {
      if (p.dining.dietaryRestrictions && Array.isArray(p.dining.dietaryRestrictions) && p.dining.dietaryRestrictions.length > 0) {
        prefs.push(`Dietary: ${p.dining.dietaryRestrictions.join(', ')}`);
      }
      if (p.dining.minibar && Array.isArray(p.dining.minibar) && p.dining.minibar.length > 0) {
        prefs.push(`Minibar: ${p.dining.minibar.join(', ')}`);
      }
    }

    // Travel preferences
    if (p.travel) {
      if (p.travel.transportationNeeded) prefs.push('Transportation needed');
      if (p.travel.earlyCheckIn) prefs.push('Early check-in');
      if (p.travel.lateCheckOut) prefs.push('Late check-out');
    }

    // Special requests
    if (p.specialRequests) prefs.push(`Special: ${p.specialRequests}`);

    return prefs;
  }, [guest?.preferences]);

  const handleAddNote = () => {
    if (newNote.trim() && guest) {
      const updatedGuest = addNoteToGuest(guest, newNote.trim());
      setGuest(updatedGuest);
      setNewNote('');
    }
  };

  const handleDeleteNote = (noteId) => {
    if (guest) {
      const updatedGuest = removeNoteFromGuest(guest, noteId);
      setGuest(updatedGuest);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-[1440px] mx-auto px-8 py-8">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-[#A57865]" />
          <span className="ml-3 text-neutral-500">Loading guest profile...</span>
        </div>
      </div>
    );
  }

  if (error || !guest) {
    return (
      <div className="max-w-[1440px] mx-auto px-8 py-8">
        <div className="text-center py-16">
          <p className="text-neutral-500">{error || 'Guest not found'}</p>
          <button
            onClick={() => navigate('/admin/guests')}
            className="mt-4 px-4 py-2 bg-[#A57865] text-white rounded-lg hover:bg-[#8E6554] transition-colors"
          >
            Back to Guests
          </button>
        </div>
      </div>
    );
  }

  const statusConfig = GUEST_STATUS_CONFIG[guest.status] || GUEST_STATUS_CONFIG['Active'];
  const emotionConfig = EMOTION_CONFIG[guest.emotion] || EMOTION_CONFIG['neutral'];

  // Normalize notes
  const guestNotes = Array.isArray(guest.notes)
    ? guest.notes
    : guest.notes
    ? [{ id: 'legacy', text: guest.notes, date: new Date().toISOString() }]
    : [];

  return (
    <div className="max-w-[1440px] mx-auto px-8 py-8 space-y-8">
      {/* Back Button */}
      <button
        onClick={() => navigate('/admin/guests')}
        className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors group"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span className="font-medium">Back to Guests</span>
      </button>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-[#A57865]/10 via-[#C8B29D]/10 to-[#5C9BA4]/10 px-8 py-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-[#A57865]/10 rounded-2xl flex items-center justify-center">
                <span className="text-3xl font-bold text-[#A57865]">
                  {guest.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-3xl font-sans font-bold text-neutral-900">{guest.name}</h1>
                <p className="text-neutral-600 mt-1">{guest.email}</p>
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold ${tierConfig.bgColor} ${tierConfig.textColor}`}>
                    <Award className="w-3 h-3" />
                    {tierConfig.icon} {loyaltyTier}
                  </span>
                  <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${statusConfig.bgColor} ${statusConfig.textColor}`}>
                    {statusConfig.label}
                  </span>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium ${emotionConfig.bgColor || 'bg-yellow-50'} ${emotionConfig.color || 'text-yellow-700'}`}>
                    <span className="text-sm">{emotionConfig.emoji}</span>
                    {emotionConfig.label}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMessageModalOpen(true)}
                className="px-4 py-2.5 bg-white border border-neutral-200 text-neutral-700 text-sm font-medium rounded-xl hover:border-[#A57865]/30 hover:bg-neutral-50 transition-all duration-200 flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                Message
              </button>
              <button className="px-4 py-2.5 bg-[#A57865] text-white text-sm font-medium rounded-xl hover:bg-[#8E6554] transition-all duration-200 flex items-center gap-2">
                <Edit className="w-4 h-4" />
                Edit Profile
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left Column - Contact & Stats */}
        <div className="space-y-6">
          {/* Contact Information */}
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6">
            <div className="flex items-center gap-2 pb-3 border-b border-neutral-200 mb-4">
              <div className="w-1 h-5 bg-[#A57865] rounded-full"></div>
              <h3 className="font-bold text-neutral-900">Contact Information</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#A57865]/10 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-[#A57865]" />
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Email</p>
                  <a href={`mailto:${guest.email}`} className="text-sm font-medium text-neutral-900 hover:text-[#A57865]">
                    {guest.email}
                  </a>
                </div>
              </div>
              {guest.phone && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#5C9BA4]/10 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-[#5C9BA4]" />
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500">Phone</p>
                    <a href={`tel:${guest.phone}`} className="text-sm font-medium text-neutral-900 hover:text-[#5C9BA4]">
                      {guest.phone}
                    </a>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#4E5840]/10 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-[#4E5840]" />
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Country</p>
                  <p className="text-sm font-medium text-neutral-900">{guest.country}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stay Statistics */}
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6">
            <div className="flex items-center gap-2 pb-3 border-b border-neutral-200 mb-4">
              <div className="w-1 h-5 bg-[#4E5840] rounded-full"></div>
              <h3 className="font-bold text-neutral-900">Stay Statistics</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-[#A57865]/5 to-[#A57865]/10 rounded-xl p-4 border border-[#A57865]/20">
                <TrendingUp className="w-5 h-5 text-[#A57865] mb-2" />
                <p className="text-xs text-[#A57865] font-medium">Total Stays</p>
                <p className="text-2xl font-bold text-neutral-900">{guest.totalStays || 0}</p>
              </div>
              <div className="bg-gradient-to-br from-[#4E5840]/5 to-[#4E5840]/10 rounded-xl p-4 border border-[#4E5840]/20">
                <DollarSign className="w-5 h-5 text-[#4E5840] mb-2" />
                <p className="text-xs text-[#4E5840] font-medium">Total Spent</p>
                <p className="text-2xl font-bold text-[#4E5840]">{formatCurrency(guest.totalSpent || 0)}</p>
              </div>
              <div className="col-span-2 bg-[#FAF8F6] rounded-xl p-4 border border-neutral-100">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-[#A57865]" />
                  <div>
                    <p className="text-xs text-neutral-500">Last Stay</p>
                    <p className="text-sm font-semibold text-neutral-900">
                      {guest.lastStay ? formatDate(guest.lastStay) : 'No stays yet'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tags */}
          {guest.tags && guest.tags.length > 0 && (
            <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6">
              <div className="flex items-center gap-2 pb-3 border-b border-neutral-200 mb-4">
                <div className="w-1 h-5 bg-[#5C9BA4] rounded-full"></div>
                <h3 className="font-bold text-neutral-900">Tags</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {guest.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#5C9BA4]/10 text-[#5C9BA4] rounded-full text-xs font-medium"
                  >
                    <Tag className="w-3 h-3" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Preferences */}
          {guestPreferences.length > 0 && (
            <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6">
              <div className="flex items-center gap-2 pb-3 border-b border-neutral-200 mb-4">
                <div className="w-1 h-5 bg-[#CDB261] rounded-full"></div>
                <h3 className="font-bold text-neutral-900">Preferences</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {guestPreferences.map((pref, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-3 py-1.5 bg-[#CDB261]/10 text-[#CDB261] rounded-full text-xs font-medium"
                  >
                    {pref}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Middle Column - Charts */}
        <div className="space-y-6">
          {/* Spending Over Time Chart */}
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6">
            <div className="flex items-center gap-2 pb-3 border-b border-neutral-200 mb-4">
              <div className="w-1 h-5 bg-[#A57865] rounded-full"></div>
              <h3 className="font-bold text-neutral-900">Spending Over Time</h3>
            </div>
            {spendingByYear.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={spendingByYear}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                    <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
                    <Tooltip
                      formatter={(value) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #E5E5E5',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="amount" fill="#A57865" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 text-neutral-300 mx-auto mb-2" />
                  <p className="text-sm text-neutral-500">No spending data</p>
                </div>
              </div>
            )}
          </div>

          {/* Room Type Preferences */}
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6">
            <div className="flex items-center gap-2 pb-3 border-b border-neutral-200 mb-4">
              <div className="w-1 h-5 bg-[#5C9BA4] rounded-full"></div>
              <h3 className="font-bold text-neutral-900">Room Type Preferences</h3>
            </div>
            {roomTypePreferences.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={roomTypePreferences}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {roomTypePreferences.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-3 mt-2">
                  {roomTypePreferences.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-1.5">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                      />
                      <span className="text-xs text-neutral-600">{entry.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center">
                <div className="text-center">
                  <Star className="w-12 h-12 text-neutral-300 mx-auto mb-2" />
                  <p className="text-sm text-neutral-500">No room preferences yet</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Notes & History */}
        <div className="space-y-6">
          {/* Notes */}
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 bg-[#4E5840] rounded-full"></div>
                <h3 className="font-bold text-neutral-900">Notes ({guestNotes.length})</h3>
              </div>
            </div>

            {/* Add Note */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddNote();
                  }
                }}
                placeholder="Add a note..."
                className="flex-1 px-3 py-2 text-sm bg-[#FAF8F6] border border-neutral-200 rounded-lg hover:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-[#4E5840] focus:ring-offset-1 focus:bg-white transition-all duration-200"
              />
              <button
                onClick={handleAddNote}
                disabled={!newNote.trim()}
                className="px-3 py-2 bg-[#4E5840]/10 hover:bg-[#4E5840]/20 text-[#4E5840] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Notes List */}
            <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
              {guestNotes.length > 0 ? (
                guestNotes.map((note, idx) => (
                  <div
                    key={note.id || idx}
                    className="bg-[#FAF8F6] rounded-lg p-3 border border-neutral-100 group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm text-neutral-800 leading-relaxed">{note.text || note}</p>
                        {note.date && (
                          <p className="text-xs text-neutral-400 mt-1">
                            {formatDateTime(note.date)}
                            {note.author && ` - ${note.author}`}
                          </p>
                        )}
                      </div>
                      {note.id && (
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-rose-100 rounded text-rose-500 transition-all duration-200"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <StickyNote className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
                  <p className="text-sm text-neutral-500">No notes yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Stay History */}
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6">
            <div className="flex items-center gap-2 pb-3 border-b border-neutral-200 mb-4">
              <div className="w-1 h-5 bg-[#A57865] rounded-full"></div>
              <h3 className="font-bold text-neutral-900">Stay History ({guest.history?.length || 0})</h3>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
              {guest.history && guest.history.length > 0 ? (
                guest.history.map((stay, index) => (
                  <div
                    key={index}
                    className="bg-[#FAF8F6] rounded-lg p-3 border border-neutral-100 hover:border-[#A57865]/30 transition-all duration-150"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-neutral-900">
                        {formatDate(stay.date)}
                      </p>
                      <p className="text-sm font-bold text-[#4E5840]">
                        {formatCurrency(stay.amount)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-neutral-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {stay.nights} {stay.nights === 1 ? 'night' : 'nights'}
                      </span>
                      {stay.roomType && (
                        <span className="px-2 py-0.5 bg-neutral-100 rounded">
                          {stay.roomType}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
                  <p className="text-sm text-neutral-500">No stay history</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Message Guest Modal */}
      <MessageGuestModal
        guest={guest ? {
          id: guest.id,
          name: guest.name,
          email: guest.email
        } : null}
        isOpen={isMessageModalOpen}
        onClose={() => setIsMessageModalOpen(false)}
      />
    </div>
  );
}

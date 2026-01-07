import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Check, ArrowLeft, Star, Sparkles, Eye, TrendingUp, Bed, Sun, Moon, Trees, Volume2, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePreCheckIn } from '@/contexts/PreCheckInContext';
import logo from '@/assets/logo.png';

interface RoomRecommendation {
  room_id: number;
  room_number: string;
  room_type: string;
  floor: number;
  view: string;
  bed_type: string;
  score: number;
  reasoning: string[];
}

interface AIRoomSelectionStepProps {
  onNext: () => void;
  onPrevious?: () => void;
}

export function AIRoomSelectionStep({ onNext, onPrevious }: AIRoomSelectionStepProps) {
  const navigate = useNavigate();
  const { updatePreCheckInData, getRecommendedRooms, preCheckInData } = usePreCheckIn();
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [selectionMode, setSelectionMode] = useState<'choice' | 'ai' | 'manual' | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [showPreferences, setShowPreferences] = useState(true);
  const [recommendedRooms, setRecommendedRooms] = useState<RoomRecommendation[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [roomsError, setRoomsError] = useState<string | null>(null);

  const handleLogoClick = () => {
    const confirmed = window.confirm('Are you sure you want to cancel the pre-check-in? Your progress will be lost.');
    if (confirmed) {
      navigate('/');
    }
  };

  // Preference states
  const [floorPreference, setFloorPreference] = useState<string>('any');
  const [viewPreference, setViewPreference] = useState<string>('any');
  const [bedType, setBedType] = useState<string>('any');
  const [quietnessLevel, setQuietnessLevel] = useState<string>('any');

  const handlePreferencesContinue = () => {
    // Save preferences to context - using correct field names
    updatePreCheckInData({
      roomPreferences: {
        floor: floorPreference as any,
        view: viewPreference as any,
        bedType: bedType as any,
        quietness: quietnessLevel as any,
      },
    });
    setShowPreferences(false);
  };

  const handleModeSelect = (mode: 'ai' | 'manual') => {
    setSelectionMode(mode);
    if (mode === 'ai') {
      handleAnalyze();
    } else {
      setShowRecommendations(true);
    }
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setRoomsError(null);
    try {
      // Fetch real room recommendations from API
      const rooms = await getRecommendedRooms();
      if (rooms && rooms.length > 0) {
        setRecommendedRooms(rooms);
      } else {
        setRoomsError('No rooms available for your dates');
      }
    } catch (error) {
      console.error('Failed to get room recommendations:', error);
      setRoomsError('Failed to load room recommendations');
    } finally {
      setIsAnalyzing(false);
      setShowRecommendations(true);
    }
  };

  const handleRoomSelect = (roomId: string) => {
    // Toggle selection - if clicking the same room, deselect it
    const newSelection = selectedRoom === roomId ? null : roomId;
    setSelectedRoom(newSelection);

    // Find the full room data and update context
    const selectedRoomData = recommendedRooms.find(r => String(r.room_id) === roomId);
    if (selectedRoomData && newSelection) {
      updatePreCheckInData({
        selectedRoom: {
          room_id: selectedRoomData.room_id,  // Store the actual database room ID
          number: selectedRoomData.room_number,
          floor: selectedRoomData.floor,
          view: selectedRoomData.view || '',
          aiScore: selectedRoomData.score,
          aiReasoning: selectedRoomData.reasoning.filter(r => r),
        } as any,
      });
    } else {
      updatePreCheckInData({ selectedRoom: undefined });
    }
  };

  const handleContinue = () => {
    if (selectedRoom) {
      onNext();
    }
  };

  const steps = [
    { number: 1, label: 'Welcome', active: false },
    { number: 2, label: 'Guest Details', active: false },
    { number: 3, label: 'Room Preferences', active: true },
    { number: 4, label: 'Verification', active: false },
    { number: 5, label: 'Documents', active: false },
    { number: 6, label: 'Payment Info', active: false },
    { number: 7, label: 'Review', active: false },
    { number: 8, label: 'Confirmation', active: false },
  ];

  return (
    <div className="flex min-h-screen bg-white">
      {/* LEFT COLUMN - Vertical Stepper */}
      <div className="w-[410px] min-h-screen px-12 py-12 border-r border-neutral-200 bg-white">
        <div className="sticky top-12">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-20"
          >
            <img
              src={logo}
              alt="Glimmora"
              className="h-10 w-auto cursor-pointer"
              onClick={handleLogoClick}
            />
          </motion.div>

          {/* Vertical Stepper */}
          <div className="space-y-0">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-start gap-4">
                {/* Step Indicator Column */}
                <div className="flex flex-col items-center">
                  {/* Circle */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                      step.active
                        ? 'bg-[#A57865] text-white'
                        : 'bg-transparent text-neutral-400 border border-neutral-300'
                    }`}
                  >
                    {step.active ? <div className="w-2 h-2 bg-white rounded-full" /> : step.number}
                  </motion.div>

                  {/* Connector Line */}
                  {index < steps.length - 1 && (
                    <div className="w-px h-10 bg-neutral-200 mt-1.5" />
                  )}
                </div>

                {/* Step Label */}
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 + 0.1 }}
                  className="pt-1 pb-8"
                >
                  <div
                    className={`text-sm font-medium mb-1 ${
                      step.active ? 'text-neutral-900' : 'text-neutral-500'
                    }`}
                  >
                    {step.label}
                  </div>
                  {step.active && (
                    <div className="text-xs text-neutral-500">
                      Choose your room selection method
                    </div>
                  )}
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN - Content Card */}
      <div className="flex-1 flex items-start justify-center pt-16 px-16" style={{ backgroundColor: '#FAFAFA' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg"
        >
          {/* Previous Button */}
          <button
            onClick={onPrevious}
            className="flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          {/* Content Card */}
          <div className="bg-white p-8 rounded-2xl border-2 border-neutral-200 shadow-lg">
            {/* Header */}
            <div className="mb-10">
              <h1 className="text-2xl font-semibold text-neutral-900 mb-2">
                {showPreferences ? 'Room Preferences' : 'Select Your Room'}
              </h1>
              <p className="text-sm text-neutral-500">
                {showPreferences
                  ? 'Tell us your preferences to find the perfect room'
                  : 'Choose how you would like to select your room'}
              </p>
            </div>

            {showPreferences ? (
              /* Preferences Form */
              <div className="space-y-6">
                {/* Floor Preference */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-3">
                    Floor Preference
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 'low', label: 'Low', desc: 'Floors 2-5' },
                      { value: 'mid', label: 'Mid', desc: 'Floors 6-10' },
                      { value: 'high', label: 'High', desc: 'Floors 11+' },
                      { value: 'any', label: 'Any', desc: 'No preference' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setFloorPreference(option.value)}
                        className={`p-4 border-2 rounded-lg transition-all text-left ${
                          floorPreference === option.value
                            ? 'border-[#A57865] bg-[#A57865]/5'
                            : 'border-neutral-200 hover:border-neutral-300'
                        }`}
                      >
                        <div className="font-medium text-sm text-neutral-900">{option.label}</div>
                        <div className="text-xs text-neutral-600 mt-0.5">{option.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* View Preference */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-3">
                    View Preference
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 'ocean', label: 'Ocean', icon: Sun },
                      { value: 'city', label: 'City', icon: Moon },
                      { value: 'garden', label: 'Garden', icon: Trees },
                      { value: 'any', label: 'Any', icon: Eye },
                    ].map((option) => {
                      const Icon = option.icon;
                      return (
                        <button
                          key={option.value}
                          onClick={() => setViewPreference(option.value)}
                          className={`p-4 border-2 rounded-lg transition-all ${
                            viewPreference === option.value
                              ? 'border-[#A57865] bg-[#A57865]/5'
                              : 'border-neutral-200 hover:border-neutral-300'
                          }`}
                        >
                          <div className="flex flex-col items-center gap-2">
                            <Icon className="w-5 h-5 text-neutral-700" />
                            <div className="font-medium text-sm text-neutral-900">{option.label}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Bed Type */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-3">
                    Bed Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 'king', label: 'King' },
                      { value: 'queen', label: 'Queen' },
                      { value: 'twin', label: 'Twin' },
                      { value: 'any', label: 'Any' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setBedType(option.value)}
                        className={`p-4 border-2 rounded-lg transition-all ${
                          bedType === option.value
                            ? 'border-[#A57865] bg-[#A57865]/5'
                            : 'border-neutral-200 hover:border-neutral-300'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <Bed className="w-4 h-4 text-neutral-700" />
                          <div className="font-medium text-sm text-neutral-900">{option.label}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quietness Level */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-3">
                    Quietness Level
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'quiet', label: 'Quiet' },
                      { value: 'moderate', label: 'Moderate' },
                      { value: 'any', label: 'Any' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setQuietnessLevel(option.value)}
                        className={`p-4 border-2 rounded-lg transition-all ${
                          quietnessLevel === option.value
                            ? 'border-[#A57865] bg-[#A57865]/5'
                            : 'border-neutral-200 hover:border-neutral-300'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <Volume2 className="w-4 h-4 text-neutral-700" />
                          <div className="font-medium text-sm text-neutral-900">{option.label}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Continue Button */}
                <button
                  onClick={handlePreferencesContinue}
                  className="w-full py-2.5 text-white font-medium rounded-lg transition-all text-sm mt-4 bg-[#A57865] hover:bg-[#8E6554]"
                >
                  Continue
                </button>
              </div>
            ) : !selectionMode ? (
              /* Mode Selection */
              <div className="space-y-4">
                {/* AI Selection Option */}
                <button
                  onClick={() => handleModeSelect('ai')}
                  className="w-full p-6 border-2 border-neutral-200 rounded-lg hover:border-[#A57865] hover:bg-[#A57865]/5 transition-all text-left group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#A57865] to-[#8E6554] rounded-lg flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-6 h-6 text-white" strokeWidth={2} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-neutral-900">
                          AI Room Recommendation
                        </h3>
                        <span className="px-2 py-0.5 bg-[#A57865] text-white text-xs font-medium rounded">
                          Recommended
                        </span>
                      </div>
                      <p className="text-sm text-neutral-600 leading-relaxed">
                        Let our AI analyze your preferences and recommend the perfect room for you based on your travel details and booking history.
                      </p>
                    </div>
                  </div>
                </button>

                {/* Manual Selection Option */}
                <button
                  onClick={() => handleModeSelect('manual')}
                  className="w-full p-6 border-2 border-neutral-200 rounded-lg hover:border-neutral-300 hover:bg-neutral-50 transition-all text-left group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-neutral-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-neutral-200 transition-colors">
                      <Bed className="w-6 h-6 text-neutral-700" strokeWidth={2} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-neutral-900 mb-2">
                        Browse All Rooms
                      </h3>
                      <p className="text-sm text-neutral-600 leading-relaxed">
                        View all available rooms and choose the one that best fits your needs manually.
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            ) : isAnalyzing ? (
              /* AI Analyzing State */
              <div className="py-12 text-center">
                <div className="w-16 h-16 bg-[#A57865] rounded-full flex items-center justify-center mx-auto mb-6">
                  <TrendingUp className="w-8 h-8 text-white animate-pulse" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                  Analyzing Your Preferences
                </h3>
                <p className="text-sm text-neutral-600">
                  Finding the perfect room match for you...
                </p>
              </div>
            ) : showRecommendations ? (
              /* Room Selection */
              <div className="space-y-4">
                {/* Back to Mode Selection Button */}
                <button
                  onClick={() => {
                    setSelectionMode(null);
                    setShowRecommendations(false);
                    setSelectedRoom(null);
                  }}
                  className="flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors mb-4"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to selection mode</span>
                </button>

                {/* Header with Mode Indicator */}
                {selectionMode === 'ai' && recommendedRooms.length > 0 && (
                  <div className="flex items-center gap-2 mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-900">
                      Found {recommendedRooms.length} available rooms
                    </span>
                  </div>
                )}

                {/* Error State */}
                {roomsError && (
                  <div className="flex items-center gap-2 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <span className="text-sm font-medium text-red-900">{roomsError}</span>
                  </div>
                )}

                {/* Loading State */}
                {loadingRooms && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-[#A57865]" />
                    <span className="ml-2 text-neutral-600">Loading rooms...</span>
                  </div>
                )}

                {/* Room Cards - Use recommendedRooms from API */}
                {recommendedRooms.map((room) => {
                  const isSelected = selectedRoom === String(room.room_id);
                  return (
                    <button
                      key={room.room_id}
                      onClick={() => handleRoomSelect(String(room.room_id))}
                      className={`w-full p-5 border-2 rounded-lg transition-all text-left ${
                        isSelected
                          ? 'border-[#A57865] bg-[#A57865]/5'
                          : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      {/* Room Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-neutral-900">
                              {room.room_type}
                            </span>
                            {selectionMode === 'ai' && room.score >= 70 && (
                              <span className="px-2 py-0.5 bg-[#A57865] text-white text-xs font-medium rounded">
                                {room.score >= 90 ? 'Best Match' : 'Good Match'}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-neutral-600">
                            Floor {room.floor || 'N/A'} • Room {room.room_number}
                          </div>
                        </div>
                        {isSelected && (
                          <div className="w-6 h-6 bg-[#A57865] rounded-full flex items-center justify-center flex-shrink-0">
                            <Check className="w-4 h-4 text-white" strokeWidth={2.5} />
                          </div>
                        )}
                      </div>

                      {/* AI Score - Only show in AI mode */}
                      {selectionMode === 'ai' && (
                        <div className="flex items-center gap-2 mb-3">
                          <Star className="w-4 h-4 text-[#CDB261]" fill="#CDB261" />
                          <span className="text-sm font-semibold text-neutral-900">
                            {Math.round(room.score)}% Match Score
                          </span>
                        </div>
                      )}

                      {/* AI Reasoning - Only show in AI mode */}
                      {selectionMode === 'ai' && room.reasoning && room.reasoning.filter(r => r).length > 0 && (
                        <div className="mb-3">
                          <div className="text-xs font-medium text-neutral-700 mb-1.5">
                            Why we recommend this:
                          </div>
                          <ul className="space-y-1">
                            {room.reasoning.filter(r => r).map((reason, idx) => (
                              <li key={idx} className="text-xs text-neutral-600 flex items-start gap-1.5">
                                <span className="text-[#A57865] mt-0.5">•</span>
                                <span>{reason}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Features - Show view and bed type */}
                      <div className="mb-3">
                        <div className="flex flex-wrap gap-2">
                          {room.view && (
                            <span className="px-2 py-1 bg-neutral-100 text-neutral-700 text-xs rounded">
                              {room.view}
                            </span>
                          )}
                          {room.bed_type && (
                            <span className="px-2 py-1 bg-neutral-100 text-neutral-700 text-xs rounded">
                              {room.bed_type}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}

                {/* Continue Button */}
                <button
                  onClick={handleContinue}
                  disabled={!selectedRoom}
                  className={`w-full py-2.5 text-white font-medium rounded-lg transition-all text-sm mt-4 ${
                    selectedRoom
                      ? 'bg-[#A57865] hover:bg-[#8E6554]'
                      : 'bg-neutral-300 cursor-not-allowed'
                  }`}
                >
                  Next
                </button>
              </div>
            ) : null}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
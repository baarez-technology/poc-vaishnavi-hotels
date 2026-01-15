import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Users, MapPin, CreditCard, Download, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import { bookingService } from '@/api/services/booking.service';
import toast from 'react-hot-toast';

interface BookingDetailsPanelProps {
  bookingId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onModify?: (bookingId: string) => void;
  onCancel?: (bookingId: string) => void;
}

export function BookingDetailsPanel({ 
  bookingId, 
  isOpen, 
  onClose, 
  onModify, 
  onCancel 
}: BookingDetailsPanelProps) {
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState<any>(null);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    if (isOpen && bookingId) {
      fetchBookingDetails();
    }
  }, [isOpen, bookingId]);

  const fetchBookingDetails = async () => {
    if (!bookingId) return;

    setLoading(true);
    setBooking(null); // Reset booking state before fetching
    try {
      const data = await bookingService.getBookingById(bookingId);
      if (data) {
        setBooking(data);
      } else {
        console.error('Empty booking data received');
        toast.error('Booking details not available');
      }
    } catch (error: any) {
      console.error('Failed to fetch booking details:', error);
      const status = error.response?.status;
      const detail = error.response?.data?.detail;

      if (status === 403) {
        toast.error('You are not authorized to view this booking');
      } else if (status === 404) {
        toast.error(detail || 'Booking not found');
      } else {
        toast.error('Failed to load booking details');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClick = () => {
    setShowCancelModal(true);
  };

  const handleCancelConfirm = async () => {
    if (!bookingId || !onCancel) return;

    setCancelling(true);
    try {
      await bookingService.cancelBooking(bookingId, cancelReason || 'Guest requested cancellation');
      toast.success('Booking cancelled successfully');
      setShowCancelModal(false);
      setCancelReason('');
      onCancel(bookingId);
      onClose();
    } catch (error: any) {
      console.error('Failed to cancel booking:', error);
      toast.error(error.response?.data?.detail || 'Failed to cancel booking');
    } finally {
      setCancelling(false);
    }
  };

  const handleModify = () => {
    if (bookingId && onModify) {
      onModify(bookingId);
    }
  };

  const handleDownload = async () => {
    if (!bookingId) return;

    try {
      // Get token from localStorage with correct key
      const token = localStorage.getItem('glimmora_access_token');
      if (!token) {
        toast.error('Please log in to download');
        return;
      }

      const response = await fetch(`/api/v1/bookings/${bookingId}/download`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Download error:', response.status, errorText);
        throw new Error('Failed to download');
      }

      const blob = await response.blob();
      if (blob.size === 0) {
        throw new Error('Empty PDF received');
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `booking_confirmation_${booking?.bookingNumber || bookingId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Booking confirmation downloaded');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download booking confirmation');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          />

          {/* Side Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-neutral-200">
              <h2 className="text-xl font-semibold text-neutral-900">Booking Details</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-neutral-600" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-neutral-500">Loading booking details...</div>
                </div>
              ) : booking ? (
                <div className="space-y-6">
                  {/* Booking Status */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-neutral-500 mb-1">Booking Number</div>
                      <div className="text-lg font-semibold text-neutral-900">{booking.bookingNumber}</div>
                    </div>
                    <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                      booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                      booking.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                      booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      'bg-neutral-100 text-neutral-700'
                    }`}>
                      {booking.status?.toUpperCase()}
                    </span>
                  </div>

                  {/* Room Details */}
                  <div className="border border-neutral-200 rounded-xl p-4">
                    <h3 className="font-semibold text-neutral-900 mb-3">Room Details</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-neutral-500" />
                        <span className="text-neutral-900">{booking.room?.name || booking.roomType}</span>
                      </div>
                      {booking.room?.description && (
                        <p className="text-sm text-neutral-600">{booking.room.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Dates & Guests */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border border-neutral-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-neutral-500" />
                        <span className="text-sm font-medium text-neutral-700">Check-in</span>
                      </div>
                      <div className="text-sm text-neutral-900">
                        {format(new Date(booking.checkIn), 'MMM dd, yyyy')}
                      </div>
                    </div>
                    <div className="border border-neutral-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-neutral-500" />
                        <span className="text-sm font-medium text-neutral-700">Check-out</span>
                      </div>
                      <div className="text-sm text-neutral-900">
                        {format(new Date(booking.checkOut), 'MMM dd, yyyy')}
                      </div>
                    </div>
                  </div>

                  <div className="border border-neutral-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-neutral-500" />
                      <span className="text-sm font-medium text-neutral-700">Guests</span>
                    </div>
                    <div className="text-sm text-neutral-900">
                      {booking.guests?.adults || 0} Adults
                      {booking.guests?.children ? `, ${booking.guests.children} Children` : ''}
                    </div>
                    <div className="text-xs text-neutral-500 mt-1">
                      {booking.nights || 0} night{booking.nights !== 1 ? 's' : ''}
                    </div>
                  </div>

                  {/* Guest Information */}
                  {booking.guestInfo && (
                    <div className="border border-neutral-200 rounded-xl p-4">
                      <h3 className="font-semibold text-neutral-900 mb-3">Guest Information</h3>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-neutral-500">Name: </span>
                          <span className="text-neutral-900">
                            {booking.guestInfo.firstName} {booking.guestInfo.lastName}
                          </span>
                        </div>
                        <div>
                          <span className="text-neutral-500">Email: </span>
                          <span className="text-neutral-900">{booking.guestInfo.email}</span>
                        </div>
                        <div>
                          <span className="text-neutral-500">Phone: </span>
                          <span className="text-neutral-900">{booking.guestInfo.phone}</span>
                        </div>
                        {booking.guestInfo.country && (
                          <div>
                            <span className="text-neutral-500">Country: </span>
                            <span className="text-neutral-900">{booking.guestInfo.country}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Pricing */}
                  <div className="border border-neutral-200 rounded-xl p-4">
                    <h3 className="font-semibold text-neutral-900 mb-3">Pricing</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Base Price</span>
                        <span className="text-neutral-900">${booking.basePrice?.toFixed(2) || '0.00'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Taxes</span>
                        <span className="text-neutral-900">${booking.taxes?.toFixed(2) || '0.00'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Service Fee</span>
                        <span className="text-neutral-900">${booking.serviceFee?.toFixed(2) || '0.00'}</span>
                      </div>
                      <div className="pt-2 border-t border-neutral-200 flex justify-between font-semibold">
                        <span className="text-neutral-900">Total</span>
                        <span className="text-neutral-900">${booking.totalPrice?.toFixed(2) || '0.00'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Info */}
                  {booking.paymentStatus && (
                    <div className="border border-neutral-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CreditCard className="w-4 h-4 text-neutral-500" />
                        <span className="text-sm font-medium text-neutral-700">Payment Status</span>
                      </div>
                      <div className="text-sm text-neutral-900 capitalize">{booking.paymentStatus}</div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-neutral-500">
                  No booking details found
                </div>
              )}
            </div>

            {/* Footer Actions */}
            {booking && (
              <div className="border-t border-neutral-200 p-6 flex gap-3">
                {booking.status === 'confirmed' && (
                  <>
                    <button
                      onClick={handleModify}
                      className="flex-1 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                      <Edit className="w-4 h-4" />
                      Modify
                    </button>
                    <button
                      onClick={handleCancelClick}
                      className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      Cancel
                    </button>
                  </>
                )}
                <button
                  onClick={handleDownload}
                  className="px-4 py-2.5 bg-white border border-neutral-300 hover:border-neutral-400 text-neutral-900 font-medium rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}

      {/* Cancellation Reason Modal */}
      {showCancelModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-neutral-900">Cancel Booking</h3>
                <p className="text-sm text-neutral-500">This action cannot be undone</p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Reason for cancellation (optional)
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Please let us know why you're cancelling..."
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                rows={3}
              />
            </div>

            {booking?.paymentStatus === 'paid' && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  <strong>Refund Policy:</strong> Cancellations made within 48 hours of check-in may be subject to a cancellation fee. Refunds will be processed within 5-7 business days.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                }}
                className="flex-1 px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium rounded-lg transition-colors text-sm"
              >
                Keep Booking
              </button>
              <button
                onClick={handleCancelConfirm}
                disabled={cancelling}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium rounded-lg transition-colors text-sm"
              >
                {cancelling ? 'Cancelling...' : 'Yes, Cancel Booking'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


/**
 * CheckInDrawer — 3-step admin check-in flow with ID verification & AI
 * Step 1: Guest Info & ID Upload/Verification
 * Step 2: Room & Preferences
 * Step 3: Review & Complete Check-In
 */

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  User, Upload, Shield, ShieldCheck, ShieldX, Check, ChevronRight, ChevronLeft,
  Loader2, Camera, CreditCard, Bed, FileText, AlertCircle, CheckCircle,
  X, Calendar, MapPin, Thermometer, BedDouble,
} from 'lucide-react';
import { Drawer } from '../ui2/Drawer';
import { Button } from '../ui2/Button';
import { precheckinService, type PreCheckInResponse } from '@/api/services/precheckin.service';
import { roomsService } from '@/api/services/rooms.service';
import { PreCheckInDetails } from '../shared/PreCheckInDetails';
import type { CheckInData } from '@/api/services/booking.service';
import { cn } from '@/lib/utils';

// ── Types ───────────────────────────────────────────────────────────────

interface CheckInDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any; // AdminBooking from useBookings
  onCheckInComplete: (bookingId: string, data: CheckInData) => Promise<boolean>;
}

interface VerificationResult {
  verified: boolean;
  confidence: number;
  extractedName?: string;
  idTypeDetected?: string;
  idNumber?: string;
  message?: string;
}

const ID_TYPES = [
  { value: 'aadhaar', label: 'Aadhaar Card' },
  { value: 'passport', label: 'Passport' },
  { value: 'drivers_license', label: "Driver's License" },
  { value: 'national_id', label: 'National ID' },
] as const;

// ── Helpers ─────────────────────────────────────────────────────────────

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
};

// ── Step Indicator ──────────────────────────────────────────────────────

function StepIndicator({ currentStep }: { currentStep: number }) {
  const steps = [
    { num: 1, label: 'Guest & ID' },
    { num: 2, label: 'Room & Notes' },
    { num: 3, label: 'Review' },
  ];
  return (
    <div className="flex items-center justify-center gap-2 py-4 px-6 border-b border-neutral-100 bg-neutral-50/50">
      {steps.map((step, i) => (
        <div key={step.num} className="flex items-center gap-2">
          <div className={cn(
            'flex items-center gap-1.5',
            currentStep === step.num && 'text-terra-600',
            currentStep > step.num && 'text-sage-600',
            currentStep < step.num && 'text-neutral-400',
          )}>
            <div className={cn(
              'w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold',
              currentStep === step.num && 'bg-terra-500 text-white',
              currentStep > step.num && 'bg-sage-500 text-white',
              currentStep < step.num && 'bg-neutral-200 text-neutral-500',
            )}>
              {currentStep > step.num ? <Check className="w-3.5 h-3.5" /> : step.num}
            </div>
            <span className="text-[12px] font-medium hidden sm:inline">{step.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={cn(
              'w-8 h-px',
              currentStep > step.num ? 'bg-sage-400' : 'bg-neutral-200',
            )} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────

export default function CheckInDrawer({ isOpen, onClose, booking, onCheckInComplete }: CheckInDrawerProps) {
  // Normalize field names (admin uses guest/room, CBS uses guestName/roomNumber)
  const guestName = booking?.guest || booking?.guestName || 'Guest';
  const roomNumber = booking?.room || booking?.roomNumber || 'Unassigned';
  const roomType = booking?.roomType || booking?.room_type || 'Standard';
  const isRoomUnassigned = !roomNumber || roomNumber === 'Unassigned' || roomNumber === 'Not assigned';

  const [step, setStep] = useState(1);
  const [idType, setIdType] = useState('aadhaar');
  const [idNumber, setIdNumber] = useState('');
  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<File | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verification, setVerification] = useState<VerificationResult | null>(null);
  const [skippedVerification, setSkippedVerification] = useState(false);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  // Room assignment during check-in (when no room pre-assigned)
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [roomsLoading, setRoomsLoading] = useState(false);

  // Pre-checkin data
  const [precheckinData, setPrecheckinData] = useState<PreCheckInResponse | null>(null);
  const [precheckinLoading, setPrecheckinLoading] = useState(false);

  // Reset state when drawer opens/closes
  useEffect(() => {
    if (isOpen && booking) {
      setStep(1);
      setIdType('aadhaar');
      setIdNumber('');
      setFrontImage(null);
      setFrontPreview(null);
      setBackImage(null);
      setBackPreview(null);
      setVerifying(false);
      setVerification(null);
      setSkippedVerification(false);
      setNotes('');
      setSubmitting(false);
      setCompleted(false);
      setAvailableRooms([]);
      setSelectedRoomId(null);

      // Fetch available rooms if no room assigned
      const bookingRoom = booking?.room || booking?.roomNumber;
      const needsRoom = !bookingRoom || bookingRoom === 'Unassigned' || bookingRoom === 'Not assigned';
      if (needsRoom) {
        setRoomsLoading(true);
        const searchParams: any = {};
        if (booking?.checkIn) searchParams.checkIn = booking.checkIn;
        if (booking?.checkOut) searchParams.checkOut = booking.checkOut;
        roomsService.getRooms(searchParams)
          .then((rooms) => {
            // Filter to available/clean rooms, prefer matching room type
            const filtered = rooms.filter((r: any) => {
              const status = (r.status || '').toLowerCase();
              return ['available', 'clean', 'inspected'].includes(status);
            });
            setAvailableRooms(filtered);
          })
          .catch(() => setAvailableRooms([]))
          .finally(() => setRoomsLoading(false));
      }

      // Fetch pre-checkin data
      setPrecheckinLoading(true);
      precheckinService.getByReservation(Number(booking.id))
        .then((data) => setPrecheckinData(data))
        .catch(() => setPrecheckinData(null))
        .finally(() => setPrecheckinLoading(false));
    }
  }, [isOpen, booking?.id]);

  // ── Dropzones ───────────────────────────────────────────────────────

  const onDropFront = useCallback((files: File[]) => {
    if (files[0]) {
      setFrontImage(files[0]);
      setFrontPreview(URL.createObjectURL(files[0]));
      setVerification(null);
    }
  }, []);

  const onDropBack = useCallback((files: File[]) => {
    if (files[0]) {
      setBackImage(files[0]);
      setBackPreview(URL.createObjectURL(files[0]));
    }
  }, []);

  const frontDropzone = useDropzone({
    onDrop: onDropFront,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg'] },
    maxFiles: 1,
  });

  const backDropzone = useDropzone({
    onDrop: onDropBack,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg'] },
    maxFiles: 1,
  });

  // ── AI Verification ─────────────────────────────────────────────────

  const handleVerify = useCallback(async () => {
    if (!frontImage) return;
    setVerifying(true);
    try {
      const imageBase64 = await fileToBase64(frontImage);
      const result = await precheckinService.verifyDocument({
        image_url: imageBase64,
        expected_name: guestName,
        id_type: idType,
      });
      setVerification({
        verified: result.verified,
        confidence: result.confidence,
        extractedName: result.extracted_name,
        idTypeDetected: result.id_type_detected,
        idNumber: result.id_number,
        message: result.message,
      });
      if (result.id_number && !idNumber) {
        setIdNumber(result.id_number);
      }
    } catch {
      setVerification({
        verified: false,
        confidence: 0,
        message: 'Verification failed. You can proceed manually.',
      });
    } finally {
      setVerifying(false);
    }
  }, [frontImage, booking?.guest, idType, idNumber]);

  // ── Check-In Submit ─────────────────────────────────────────────────

  const handleComplete = useCallback(async () => {
    if (!booking?.id) return;
    setSubmitting(true);
    try {
      const data: CheckInData = {
        notes: notes || undefined,
        id_type: idType,
        id_number: idNumber || undefined,
        id_verified: verification?.verified ?? (skippedVerification ? undefined : false),
        id_verification_confidence: verification?.confidence,
        room_id: selectedRoomId || undefined,
      };
      const success = await onCheckInComplete(booking.id, data);
      if (success) {
        setCompleted(true);
      }
    } finally {
      setSubmitting(false);
    }
  }, [booking?.id, notes, idType, idNumber, verification, skippedVerification, onCheckInComplete, selectedRoomId]);

  // ── Has pre-verified ID? ────────────────────────────────────────────

  const hasPreVerifiedId = precheckinData?.id_verified === true;
  const idVerified = verification?.verified || hasPreVerifiedId;

  if (!booking) return null;

  // ── Render Steps ────────────────────────────────────────────────────

  const renderStep1 = () => (
    <div className="space-y-5">
      {/* Booking summary */}
      <div className="rounded-[10px] border border-neutral-200 bg-neutral-50/50 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-terra-100 flex items-center justify-center">
            <User className="w-4.5 h-4.5 text-terra-600" />
          </div>
          <div>
            <p className="text-[14px] font-semibold text-neutral-900">{guestName}</p>
            <p className="text-[12px] text-neutral-500">
              {booking.bookingNumber || booking.id} · {roomType}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 text-[12px]">
          <div>
            <span className="text-neutral-400 block text-[10px] uppercase tracking-wider font-semibold">Check-in</span>
            <span className="text-neutral-700 font-medium">{formatDate(booking.checkIn)}</span>
          </div>
          <div>
            <span className="text-neutral-400 block text-[10px] uppercase tracking-wider font-semibold">Check-out</span>
            <span className="text-neutral-700 font-medium">{formatDate(booking.checkOut)}</span>
          </div>
          <div>
            <span className="text-neutral-400 block text-[10px] uppercase tracking-wider font-semibold">Room</span>
            <span className="text-neutral-700 font-medium">{roomNumber}</span>
          </div>
        </div>
      </div>

      {/* Already verified via pre-checkin */}
      {hasPreVerifiedId && (
        <div className="rounded-[10px] border border-sage-200 bg-sage-50 p-4 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-sage-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-[13px] font-semibold text-sage-800">ID Already Verified</p>
            <p className="text-[12px] text-sage-600 mt-0.5">
              Guest completed pre-check-in with verified {precheckinData?.id_type?.replace(/_/g, ' ') || 'ID'}.
              You can proceed directly or re-verify below.
            </p>
          </div>
        </div>
      )}

      {/* ID Type Selector */}
      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-500 mb-2">
          ID Document Type
        </label>
        <div className="grid grid-cols-2 gap-2">
          {ID_TYPES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setIdType(value)}
              className={cn(
                'px-3 py-2 rounded-lg border text-[13px] font-medium transition-all text-left',
                idType === value
                  ? 'border-terra-400 bg-terra-50 text-terra-700'
                  : 'border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Document Upload */}
      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-500 mb-2">
          Upload ID Document
        </label>
        <div className="grid grid-cols-2 gap-3">
          {/* Front */}
          <div>
            <p className="text-[11px] text-neutral-400 mb-1.5 font-medium">Front Side</p>
            <div
              {...frontDropzone.getRootProps()}
              className={cn(
                'border border-dashed rounded-lg p-4 text-center cursor-pointer transition-all',
                frontPreview
                  ? 'border-sage-400 bg-sage-50'
                  : 'border-neutral-300 hover:border-terra-400 hover:bg-neutral-50',
              )}
            >
              <input {...frontDropzone.getInputProps()} />
              {frontPreview ? (
                <img src={frontPreview} alt="ID Front" className="w-full h-20 object-cover rounded" />
              ) : (
                <div className="py-2">
                  <Camera className="w-5 h-5 mx-auto text-neutral-400 mb-1" />
                  <p className="text-[11px] text-neutral-500">Drop or click</p>
                </div>
              )}
            </div>
          </div>
          {/* Back */}
          <div>
            <p className="text-[11px] text-neutral-400 mb-1.5 font-medium">Back Side <span className="text-neutral-300">(optional)</span></p>
            <div
              {...backDropzone.getRootProps()}
              className={cn(
                'border border-dashed rounded-lg p-4 text-center cursor-pointer transition-all',
                backPreview
                  ? 'border-sage-400 bg-sage-50'
                  : 'border-neutral-300 hover:border-terra-400 hover:bg-neutral-50',
              )}
            >
              <input {...backDropzone.getInputProps()} />
              {backPreview ? (
                <img src={backPreview} alt="ID Back" className="w-full h-20 object-cover rounded" />
              ) : (
                <div className="py-2">
                  <Camera className="w-5 h-5 mx-auto text-neutral-400 mb-1" />
                  <p className="text-[11px] text-neutral-500">Drop or click</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Verify Button */}
      {frontImage && !verification && (
        <Button
          onClick={handleVerify}
          disabled={verifying}
          className="w-full bg-ocean-500 hover:bg-ocean-600 text-white"
        >
          {verifying ? (
            <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Verifying with AI...</>
          ) : (
            <><Shield className="w-4 h-4 mr-2" /> Verify with AI</>
          )}
        </Button>
      )}

      {/* Verification Result */}
      {verification && (
        <div className={cn(
          'rounded-[10px] border p-4',
          verification.verified
            ? 'border-sage-200 bg-sage-50'
            : 'border-amber-200 bg-amber-50',
        )}>
          <div className="flex items-center gap-2 mb-2">
            {verification.verified ? (
              <ShieldCheck className="w-5 h-5 text-sage-600" />
            ) : (
              <ShieldX className="w-5 h-5 text-amber-600" />
            )}
            <span className={cn(
              'text-[13px] font-semibold',
              verification.verified ? 'text-sage-800' : 'text-amber-800',
            )}>
              {verification.verified ? 'Verified' : 'Could Not Verify'}
            </span>
            <span className={cn(
              'ml-auto text-[12px] font-medium px-2 py-0.5 rounded-full',
              verification.confidence >= 80
                ? 'bg-sage-100 text-sage-700'
                : verification.confidence >= 50
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-red-100 text-red-700',
            )}>
              {Math.round(verification.confidence)}% confidence
            </span>
          </div>
          {verification.extractedName && (
            <p className="text-[12px] text-neutral-600">
              <span className="text-neutral-400">Name on ID:</span>{' '}
              <span className="font-medium">{verification.extractedName}</span>
            </p>
          )}
          {verification.message && (
            <p className="text-[11px] text-neutral-500 mt-1">{verification.message}</p>
          )}
        </div>
      )}

      {/* ID Number */}
      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-500 mb-1.5">
          ID Number <span className="text-neutral-300 normal-case">(optional)</span>
        </label>
        <input
          type="text"
          value={idNumber}
          onChange={(e) => setIdNumber(e.target.value)}
          placeholder="Enter ID number manually"
          className="w-full px-3 py-2 rounded-lg border border-neutral-200 text-[13px] text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-terra-200 focus:border-terra-400"
        />
      </div>

      {/* Skip verification link */}
      {!verification && !hasPreVerifiedId && (
        <button
          onClick={() => setSkippedVerification(true)}
          className="text-[12px] text-neutral-400 hover:text-neutral-600 underline underline-offset-2 transition-colors"
        >
          Skip verification and proceed manually
        </button>
      )}
    </div>
  );

  // Derive the effective room display for review step
  const selectedRoomObj = availableRooms.find((r: any) => r.id === selectedRoomId);
  const effectiveRoomNumber = selectedRoomObj
    ? (selectedRoomObj.number || selectedRoomObj.roomNumber)
    : roomNumber;

  const renderStep2 = () => (
    <div className="space-y-5">
      {/* Room Assignment */}
      <div className="rounded-[10px] border border-neutral-200 bg-neutral-50/50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Bed className="w-4 h-4 text-terra-500" />
          <span className="text-[13px] font-semibold text-neutral-800">Room Assignment</span>
        </div>

        {isRoomUnassigned ? (
          /* Room selection UI when no room is pre-assigned */
          <div>
            <div className="flex items-center gap-1.5 mb-3 p-2.5 rounded-lg bg-amber-50 border border-amber-200">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="text-[12px] text-amber-700 font-medium">
                No room assigned. Please select a room to proceed with check-in.
              </span>
            </div>

            {roomsLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-terra-500" />
                <span className="ml-2 text-[12px] text-neutral-500">Loading available rooms...</span>
              </div>
            ) : availableRooms.length === 0 ? (
              <p className="text-[12px] text-neutral-500 py-4 text-center">No available rooms found for these dates.</p>
            ) : (
              <div className="space-y-1.5 max-h-[220px] overflow-y-auto">
                {availableRooms
                  .sort((a: any, b: any) => {
                    // Prefer matching room type first
                    const aType = (a.room_type?.name || a.type || '').toLowerCase();
                    const bType = (b.room_type?.name || b.type || '').toLowerCase();
                    const target = roomType.toLowerCase();
                    const aMatch = aType.includes(target) || target.includes(aType);
                    const bMatch = bType.includes(target) || target.includes(bType);
                    if (aMatch && !bMatch) return -1;
                    if (!aMatch && bMatch) return 1;
                    const aNum = a.number || a.roomNumber || '';
                    const bNum = b.number || b.roomNumber || '';
                    return String(aNum).localeCompare(String(bNum));
                  })
                  .map((room: any) => {
                    const rNum = room.number || room.roomNumber || '—';
                    const rType = room.room_type?.name || room.type || 'Standard';
                    const rStatus = (room.status || '').toLowerCase();
                    const isSelected = selectedRoomId === room.id;
                    const isTypeMatch = rType.toLowerCase().includes(roomType.toLowerCase()) || roomType.toLowerCase().includes(rType.toLowerCase());
                    return (
                      <button
                        key={room.id}
                        onClick={() => setSelectedRoomId(room.id)}
                        className={cn(
                          'w-full flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-all',
                          isSelected
                            ? 'border-terra-500 bg-terra-50'
                            : 'border-neutral-200 hover:border-neutral-300 bg-white',
                        )}
                      >
                        <div className={cn(
                          'w-10 h-10 rounded-lg flex items-center justify-center font-bold text-[14px]',
                          isSelected ? 'bg-terra-500 text-white' : 'bg-neutral-100 text-neutral-600',
                        )}>
                          {rNum}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium text-neutral-900 flex items-center gap-2">
                            {rType}
                            {isTypeMatch && (
                              <span className="text-[10px] text-emerald-600 font-medium">Match</span>
                            )}
                          </p>
                          <p className="text-[11px] text-neutral-500 capitalize">{rStatus}</p>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-terra-500 flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
              </div>
            )}

            {/* Show booked type info */}
            <div className="mt-3 grid grid-cols-2 gap-3 text-[12px]">
              <div>
                <span className="text-neutral-400 block text-[10px] uppercase tracking-wider font-semibold">Booked Type</span>
                <span className="text-neutral-700 font-medium">{roomType}</span>
              </div>
              <div>
                <span className="text-neutral-400 block text-[10px] uppercase tracking-wider font-semibold">Nights</span>
                <span className="text-neutral-700 font-medium">{booking.nights || '—'}</span>
              </div>
            </div>
          </div>
        ) : (
          /* Normal display when room is already assigned */
          <div className="grid grid-cols-3 gap-3 text-[12px]">
            <div>
              <span className="text-neutral-400 block text-[10px] uppercase tracking-wider font-semibold">Room</span>
              <span className="text-neutral-800 font-semibold text-[14px]">{roomNumber}</span>
            </div>
            <div>
              <span className="text-neutral-400 block text-[10px] uppercase tracking-wider font-semibold">Type</span>
              <span className="text-neutral-700 font-medium">{roomType}</span>
            </div>
            <div>
              <span className="text-neutral-400 block text-[10px] uppercase tracking-wider font-semibold">Nights</span>
              <span className="text-neutral-700 font-medium">{booking.nights || '—'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Pre-checkin preferences */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <FileText className="w-4 h-4 text-sage-500" />
          <span className="text-[13px] font-semibold text-neutral-800">Pre-Check-In Details</span>
        </div>
        <PreCheckInDetails data={precheckinData} isLoading={precheckinLoading} />
      </div>

      {/* Payment status */}
      <div className="rounded-[10px] border border-neutral-200 bg-neutral-50/50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-neutral-500" />
            <span className="text-[13px] font-medium text-neutral-700">Payment</span>
          </div>
          <span className={cn(
            'text-[11px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider',
            (booking.paymentStatus === 'paid' || booking.payment_status === 'paid')
              ? 'bg-sage-100 text-sage-700'
              : 'bg-amber-100 text-amber-700',
          )}>
            {booking.paymentStatus || booking.payment_status || 'pending'}
          </span>
        </div>
        {(booking.balance != null && booking.balance > 0) && (
          <p className="text-[12px] text-amber-600 mt-2 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            Outstanding balance: ₹{booking.balance.toFixed(2)}
          </p>
        )}
      </div>

      {/* Admin notes */}
      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-500 mb-1.5">
          Check-in Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any notes for this check-in..."
          rows={3}
          className="w-full px-3 py-2 rounded-lg border border-neutral-200 text-[13px] text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-terra-200 focus:border-terra-400 resize-none"
        />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-5">
      {completed ? (
        /* Success state */
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-sage-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-sage-600" />
          </div>
          <h3 className="text-[16px] font-semibold text-neutral-900 mb-1">Check-In Complete</h3>
          <p className="text-[13px] text-neutral-500">
            {guestName} has been checked in to Room {effectiveRoomNumber}.
          </p>
          <Button
            onClick={onClose}
            className="mt-6 bg-terra-500 hover:bg-terra-600 text-white"
          >
            Done
          </Button>
        </div>
      ) : (
        /* Review summary */
        <>
          <div className="rounded-[10px] border border-neutral-200 bg-neutral-50/50 p-4 space-y-3">
            <h4 className="text-[13px] font-semibold text-neutral-800">Check-In Summary</h4>

            <div className="space-y-2 text-[12px]">
              <div className="flex justify-between">
                <span className="text-neutral-500">Guest</span>
                <span className="font-medium text-neutral-800">{guestName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Room</span>
                <span className="font-medium text-neutral-800">{effectiveRoomNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Dates</span>
                <span className="font-medium text-neutral-800">
                  {formatDate(booking.checkIn)} → {formatDate(booking.checkOut)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Nights</span>
                <span className="font-medium text-neutral-800">{booking.nights || '—'}</span>
              </div>
            </div>
          </div>

          {/* ID Verification Status */}
          <div className={cn(
            'rounded-[10px] border p-4 flex items-center gap-3',
            idVerified
              ? 'border-sage-200 bg-sage-50'
              : skippedVerification
                ? 'border-neutral-200 bg-neutral-50'
                : 'border-amber-200 bg-amber-50',
          )}>
            {idVerified ? (
              <ShieldCheck className="w-5 h-5 text-sage-600 shrink-0" />
            ) : (
              <ShieldX className="w-5 h-5 text-amber-500 shrink-0" />
            )}
            <div>
              <p className={cn(
                'text-[13px] font-semibold',
                idVerified ? 'text-sage-800' : 'text-neutral-700',
              )}>
                {idVerified
                  ? 'ID Verified'
                  : skippedVerification
                    ? 'ID Verification Skipped'
                    : 'ID Not Verified'}
              </p>
              <p className="text-[11px] text-neutral-500">
                {idType && ID_TYPES.find(t => t.value === idType)?.label}
                {idNumber && ` · ${idNumber}`}
                {verification?.confidence != null && ` · ${Math.round(verification.confidence)}% confidence`}
              </p>
            </div>
          </div>

          {/* Notes */}
          {notes && (
            <div className="rounded-[10px] border border-neutral-200 bg-neutral-50/50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-1">Notes</p>
              <p className="text-[13px] text-neutral-700">{notes}</p>
            </div>
          )}

          {/* Warning if no room selected */}
          {isRoomUnassigned && !selectedRoomId && (
            <div className="flex items-center gap-1.5 p-2.5 rounded-lg bg-amber-50 border border-amber-200">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="text-[12px] text-amber-700">
                Please go back and select a room before completing check-in.
              </span>
            </div>
          )}

          {/* Complete button */}
          <Button
            onClick={handleComplete}
            disabled={submitting || (isRoomUnassigned && !selectedRoomId)}
            className="w-full bg-terra-500 hover:bg-terra-600 text-white py-2.5"
          >
            {submitting ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Processing...</>
            ) : (
              <><CheckCircle className="w-4 h-4 mr-2" /> Complete Check-In</>
            )}
          </Button>
        </>
      )}
    </div>
  );

  // ── Drawer Footer (navigation) ──────────────────────────────────────

  const canProceedFromStep1 = hasPreVerifiedId || verification || skippedVerification;

  const footer = completed ? undefined : (
    <div className="flex items-center justify-between">
      {step > 1 ? (
        <Button
          variant="secondary"
          onClick={() => setStep(s => s - 1)}
          className="text-[13px]"
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Back
        </Button>
      ) : (
        <Button variant="secondary" onClick={onClose} className="text-[13px]">
          Cancel
        </Button>
      )}

      {step < 3 && (
        <Button
          onClick={() => setStep(s => s + 1)}
          disabled={step === 1 && !canProceedFromStep1}
          className={cn(
            'text-[13px]',
            step === 1 && !canProceedFromStep1
              ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
              : 'bg-terra-500 hover:bg-terra-600 text-white',
          )}
        >
          Continue <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      )}
    </div>
  );

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Guest Check-In"
      subtitle={guestName}
      maxWidth="max-w-2xl"
      footer={footer}
    >
      <StepIndicator currentStep={step} />
      <div className="p-6">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </div>
    </Drawer>
  );
}

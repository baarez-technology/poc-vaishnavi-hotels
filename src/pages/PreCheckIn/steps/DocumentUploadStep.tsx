import { motion } from 'framer-motion';
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Check, Shield, ArrowLeft, AlertCircle, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePreCheckIn } from '@/contexts/PreCheckInContext';
import { precheckinService } from '@/api/services/precheckin.service';
import logo from '@/assets/logo.png';
import toast from 'react-hot-toast';

interface DocumentUploadStepProps {
  onNext: () => void;
  onPrevious?: () => void;
}

interface VerificationResult {
  verified: boolean;
  confidence: number;
  extractedName?: string;
  idType?: string;
  message: string;
}

export function DocumentUploadStep({ onNext, onPrevious }: DocumentUploadStepProps) {
  const navigate = useNavigate();
  const { preCheckInData, updatePreCheckInData } = usePreCheckIn();
  const [frontUploaded, setFrontUploaded] = useState(false);
  const [backUploaded, setBackUploaded] = useState(false);
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [idType, setIdType] = useState<string>('passport');

  const handleLogoClick = () => {
    const confirmed = window.confirm('Are you sure you want to cancel the pre-check-in? Your progress will be lost.');
    if (confirmed) {
      navigate('/');
    }
  };

  const onDropFront = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles[0]) {
      const url = URL.createObjectURL(acceptedFiles[0]);
      setFrontFile(acceptedFiles[0]);
      updatePreCheckInData({
        documents: { ...preCheckInData.documents, idFrontUrl: url }
      });
      setFrontUploaded(true);
      setVerificationResult(null); // Reset verification when new file uploaded
    }
  }, [preCheckInData.documents, updatePreCheckInData]);

  const onDropBack = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles[0]) {
      const url = URL.createObjectURL(acceptedFiles[0]);
      updatePreCheckInData({
        documents: { ...preCheckInData.documents, idBackUrl: url }
      });
      setBackUploaded(true);
    }
  }, [preCheckInData.documents, updatePreCheckInData]);

  const { getRootProps: getFrontRootProps, getInputProps: getFrontInputProps } = useDropzone({
    onDrop: onDropFront,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg'] },
    maxFiles: 1,
  });

  const { getRootProps: getBackRootProps, getInputProps: getBackInputProps } = useDropzone({
    onDrop: onDropBack,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg'] },
    maxFiles: 1,
  });

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  // Verify ID document with OpenAI
  const verifyIdDocument = async () => {
    if (!frontFile) {
      toast.error('Please upload the front side of your ID');
      return;
    }

    if (!preCheckInData?.reservationId) {
      toast.error('Reservation not found. Please restart pre-check-in.');
      return;
    }

    setIsVerifying(true);
    setVerificationResult(null);

    try {
      // Get or create pre-checkin to have a valid precheckin_id for verification
      let precheckin = await precheckinService.getByReservation(preCheckInData.reservationId);

      if (!precheckin) {
        // Create a basic pre-checkin record first
        precheckin = await precheckinService.create({
          reservation_id: preCheckInData.reservationId,
          email: preCheckInData.personalInfo?.email || '',
          phone: preCheckInData.personalInfo?.phone || '',
          floor_preference: preCheckInData.roomPreferences?.floor,
          view_preference: preCheckInData.roomPreferences?.view,
          bed_type_preference: preCheckInData.roomPreferences?.bedType,
          quietness_preference: preCheckInData.roomPreferences?.quietness,
        });
      }

      if (!precheckin?.id) {
        toast.error('Failed to create pre-check-in record. Please try again.');
        setIsVerifying(false);
        return;
      }

      // Fetch fresh booking data to get the latest guest name (in case profile was updated)
      const { bookingService } = await import('@/api/services/booking.service');
      const freshBooking = await bookingService.getBooking(String(preCheckInData.reservationId));
      const expectedName = `${freshBooking.guestInfo?.firstName || ''} ${freshBooking.guestInfo?.lastName || ''}`.trim();

      if (!expectedName) {
        toast.error('Guest name not found. Please go back and verify your booking.');
        setIsVerifying(false);
        return;
      }

      // Update context with fresh guest name
      updatePreCheckInData({ guestName: expectedName });

      // Convert file to base64
      const imageBase64 = await fileToBase64(frontFile);

      // Call verification API with precheckin_id so it updates the database
      const result = await precheckinService.verifyDocument({
        precheckin_id: precheckin.id,
        image_url: imageBase64,
        expected_name: expectedName,
        id_type: idType,
      });

      setVerificationResult({
        verified: result.verified,
        confidence: result.confidence,
        extractedName: result.extracted_name,
        idType: result.id_type_detected,
        message: result.message,
      });

      if (result.verified) {
        toast.success('ID verified successfully!');
        // Store verification result in context
        updatePreCheckInData({
          documents: {
            ...preCheckInData.documents,
            idVerified: true,
            idVerificationConfidence: result.confidence,
            extractedName: result.extracted_name,
            idType: result.id_type_detected || idType,
          }
        });
      } else {
        toast.error(result.message || 'ID verification failed. Please upload a valid government ID that matches your booking name.');
      }
    } catch (error: any) {
      console.error('ID verification error:', error);
      toast.error('Failed to verify ID. Please try again.');
      setVerificationResult({
        verified: false,
        confidence: 0,
        message: 'Verification service unavailable. Please try again.',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleContinue = () => {
    if (frontUploaded && backUploaded && verificationResult?.verified) {
      onNext();
    }
  };

  const steps = [
    { number: 1, label: 'Welcome', active: false },
    { number: 2, label: 'Guest Details', active: false },
    { number: 3, label: 'Room Preferences', active: false },
    { number: 4, label: 'Verification', active: false },
    { number: 5, label: 'Documents', active: true },
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
                      Upload your ID document
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
                Upload ID Document
              </h1>
              <p className="text-sm text-neutral-500">
                For security and verification purposes
              </p>
            </div>

            <div className="space-y-5">
              {/* Front Side Upload */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Front Side
                </label>
                <div
                  {...getFrontRootProps()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
                    frontUploaded
                      ? 'border-green-500 bg-green-50'
                      : 'border-neutral-300 hover:border-[#A57865] hover:bg-neutral-50'
                  }`}
                >
                  <input {...getFrontInputProps()} />
                  {frontUploaded ? (
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mb-3">
                        <Check className="w-6 h-6 text-white" strokeWidth={2.5} />
                      </div>
                      <p className="text-sm font-medium text-green-900 mb-1">Front side uploaded!</p>
                      <p className="text-xs text-green-700">Click to replace</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mb-3">
                        <Upload className="w-6 h-6 text-neutral-500" strokeWidth={2} />
                      </div>
                      <p className="text-sm font-medium text-neutral-900 mb-1">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-neutral-600">PNG, JPG up to 10MB</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Back Side Upload */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Back Side
                </label>
                <div
                  {...getBackRootProps()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
                    backUploaded
                      ? 'border-green-500 bg-green-50'
                      : 'border-neutral-300 hover:border-[#A57865] hover:bg-neutral-50'
                  }`}
                >
                  <input {...getBackInputProps()} />
                  {backUploaded ? (
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mb-3">
                        <Check className="w-6 h-6 text-white" strokeWidth={2.5} />
                      </div>
                      <p className="text-sm font-medium text-green-900 mb-1">Back side uploaded!</p>
                      <p className="text-xs text-green-700">Click to replace</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mb-3">
                        <Upload className="w-6 h-6 text-neutral-500" strokeWidth={2} />
                      </div>
                      <p className="text-sm font-medium text-neutral-900 mb-1">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-neutral-600">PNG, JPG up to 10MB</p>
                    </div>
                  )}
                </div>
              </div>

              {/* ID Type Selector */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  ID Document Type
                </label>
                <select
                  value={idType}
                  onChange={(e) => setIdType(e.target.value)}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A57865] focus:border-transparent"
                >
                  <option value="passport">Passport</option>
                  <option value="drivers_license">Driver's License</option>
                  <option value="national_id">National ID Card</option>
                  <option value="other">Other Government ID</option>
                </select>
              </div>

              {/* Verification Result */}
              {verificationResult && (
                <div className={`flex items-start gap-3 p-4 rounded-lg border ${
                  verificationResult.verified
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}>
                  {verificationResult.verified ? (
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className={`text-sm font-semibold mb-1 ${
                      verificationResult.verified ? 'text-green-900' : 'text-red-900'
                    }`}>
                      {verificationResult.verified ? 'ID Verified Successfully' : 'Verification Failed'}
                    </p>
                    <p className={`text-xs ${
                      verificationResult.verified ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {verificationResult.message}
                    </p>
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-neutral-600">
                        <span className="font-medium">Booking Name:</span> {preCheckInData?.guestName || 'N/A'}
                      </p>
                      {verificationResult.extractedName && (
                        <p className="text-xs text-neutral-600">
                          <span className="font-medium">Name on ID:</span> {verificationResult.extractedName}
                        </p>
                      )}
                      {verificationResult.idType && (
                        <p className="text-xs text-neutral-600">
                          <span className="font-medium">Document Type:</span> {verificationResult.idType}
                        </p>
                      )}
                      {verificationResult.confidence > 0 && (
                        <p className="text-xs text-neutral-600">
                          <span className="font-medium">Confidence:</span> {Math.round(verificationResult.confidence * 100)}%
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Security Notice */}
              <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <Shield className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-blue-900">
                  <p className="font-semibold mb-1">Your Privacy & Security</p>
                  <p>Documents are encrypted and used only for verification. AI-powered verification ensures the name on your ID matches your booking.</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 mt-6">
                {/* Verify Button - shown when both sides uploaded but not yet verified */}
                {frontUploaded && backUploaded && !verificationResult?.verified && (
                  <button
                    onClick={verifyIdDocument}
                    disabled={isVerifying}
                    className={`w-full py-2.5 text-white font-medium rounded-lg transition-all text-sm flex items-center justify-center gap-2 ${
                      isVerifying
                        ? 'bg-neutral-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {isVerifying ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Verifying ID...
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4" />
                        Verify ID Document
                      </>
                    )}
                  </button>
                )}

                {/* Continue Button */}
                <button
                  onClick={handleContinue}
                  disabled={!frontUploaded || !backUploaded || !verificationResult?.verified}
                  className={`w-full py-2.5 text-white font-medium rounded-lg transition-all text-sm ${
                    frontUploaded && backUploaded && verificationResult?.verified
                      ? 'bg-[#A57865] hover:bg-[#8E6554]'
                      : 'bg-neutral-300 cursor-not-allowed'
                  }`}
                >
                  {verificationResult?.verified ? 'Continue' : 'Upload & Verify to Continue'}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
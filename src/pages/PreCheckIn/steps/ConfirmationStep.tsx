import { motion } from 'framer-motion';
import { CheckCircle, Download, Smartphone, Key, Calendar, MapPin, Mail, Phone, Clock, Sparkles } from 'lucide-react';
import { usePreCheckIn } from '@/contexts/PreCheckInContext';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { QRCodeSVG as QRCode } from 'qrcode.react';
import { useRef } from 'react';
import logo from '@/assets/logo.png';

interface ConfirmationStepProps {
  onNext: () => void;
}

export function ConfirmationStep({ }: ConfirmationStepProps) {
  const { preCheckInData } = usePreCheckIn();
  const navigate = useNavigate();
  const qrRef = useRef<HTMLDivElement>(null);

  // Download digital key as PNG image
  const handleDownloadKey = () => {
    if (!qrRef.current) return;

    const svg = qrRef.current.querySelector('svg');
    if (!svg) return;

    // Create canvas to render QR code with key info
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const padding = 40;
    const qrSize = 300;
    const headerHeight = 80;
    const footerHeight = 100;
    const totalWidth = qrSize + (padding * 2);
    const totalHeight = qrSize + headerHeight + footerHeight + (padding * 2);

    canvas.width = totalWidth;
    canvas.height = totalHeight;

    // Background
    ctx.fillStyle = '#A57865';
    ctx.fillRect(0, 0, totalWidth, totalHeight);

    // White card area
    ctx.fillStyle = '#FFFFFF';
    ctx.roundRect(padding / 2, padding / 2, totalWidth - padding, totalHeight - padding, 16);
    ctx.fill();

    // Header text
    ctx.fillStyle = '#A57865';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Glimmora Hotel', totalWidth / 2, padding + 30);
    ctx.font = '14px Arial';
    ctx.fillStyle = '#666666';
    ctx.fillText('Digital Room Key', totalWidth / 2, padding + 55);

    // Convert SVG to image and draw
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      // Draw QR code
      ctx.drawImage(img, padding, headerHeight + padding / 2, qrSize, qrSize);

      // Footer with key info
      ctx.fillStyle = '#333333';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      const footerY = headerHeight + qrSize + padding;
      ctx.fillText(`Room: ${typeof preCheckInData?.selectedRoom === 'object' ? preCheckInData?.selectedRoom?.number : preCheckInData?.selectedRoom || 'TBA'}`, totalWidth / 2, footerY + 20);
      ctx.font = '12px monospace';
      ctx.fillStyle = '#666666';
      ctx.fillText(`Key ID: ${preCheckInData?.digitalKey?.keyId || 'N/A'}`, totalWidth / 2, footerY + 45);

      // Check-in dates
      ctx.font = '11px Arial';
      const checkIn = preCheckInData?.checkInDate ? format(new Date(preCheckInData.checkInDate), 'MMM dd') : '';
      const checkOut = preCheckInData?.checkOutDate ? format(new Date(preCheckInData.checkOutDate), 'MMM dd, yyyy') : '';
      if (checkIn && checkOut) {
        ctx.fillText(`${checkIn} - ${checkOut}`, totalWidth / 2, footerY + 65);
      }

      // Download
      const link = document.createElement('a');
      link.download = `glimmora-digital-key-${preCheckInData?.digitalKey?.keyId || 'room'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header with Logo */}
      <div className="border-b border-neutral-200/50 bg-white/80 backdrop-blur-xl shadow-sm">
        <div className="max-w-4xl mx-auto px-8 py-6">
          <img
            src={logo}
            alt="Glimmora"
            className="h-10 w-auto cursor-pointer"
            onClick={() => navigate('/')}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Success Header */}
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle className="w-12 h-12 text-green-600" strokeWidth={2} />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-semibold text-neutral-900 mb-3"
            >
              Pre-Check-In Complete!
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-lg text-neutral-600"
            >
              Welcome to Glimmora, {preCheckInData?.guestName || preCheckInData?.personalInfo?.email?.split('@')[0] || 'Guest'}! Your room is ready and waiting.
            </motion.p>
          </div>

          {/* Digital Key Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-br from-[#A57865] to-[#8E6554] rounded-2xl border-2 border-[#8E6554] shadow-lg p-8 text-white"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Key className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Your Digital Key</h2>
                  <p className="text-sm text-white/80">Room {typeof preCheckInData?.selectedRoom === 'object' ? preCheckInData?.selectedRoom?.number : preCheckInData?.selectedRoom || 'TBA'}</p>
                </div>
              </div>
              <Sparkles className="w-6 h-6 text-white/60" />
            </div>

            {/* QR Code */}
            <div className="flex justify-center mb-6" ref={qrRef}>
              <div className="p-4 bg-white rounded-lg">
                <QRCode
                  value={preCheckInData?.digitalKey?.qrCode || 'GLIMMORA-DIGITAL-KEY'}
                  size={180}
                  level="H"
                  includeMargin={false}
                />
              </div>
            </div>

            {/* Key ID */}
            <div className="text-center mb-6">
              <div className="text-xs text-white/70 mb-1">Key ID</div>
              <div className="text-sm font-mono font-semibold">
                {preCheckInData?.digitalKey?.keyId || 'DK-XXXXXXXX'}
              </div>
            </div>

            {/* Download Button */}
            <button
              onClick={handleDownloadKey}
              className="w-full py-3 bg-white text-[#A57865] font-semibold rounded-2xl hover:bg-neutral-50 transition-all flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              Download Digital Key
            </button>
          </motion.div>

          {/* Booking Details Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="grid md:grid-cols-2 gap-6"
          >
            {/* Stay Details */}
            <div className="bg-white border-2 border-neutral-200 rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">Stay Details</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-[#A57865] mt-0.5" />
                  <div className="flex-1">
                    <div className="text-xs text-neutral-600 mb-1">Check-in / Check-out</div>
                    <div className="text-sm font-medium text-neutral-900">
                      {preCheckInData?.checkInDate && format(new Date(preCheckInData.checkInDate), 'MMM dd, yyyy')}
                      {' - '}
                      {preCheckInData?.checkOutDate && format(new Date(preCheckInData.checkOutDate), 'MMM dd, yyyy')}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-[#A57865] mt-0.5" />
                  <div className="flex-1">
                    <div className="text-xs text-neutral-600 mb-1">Estimated Arrival</div>
                    <div className="text-sm font-medium text-neutral-900">
                      {preCheckInData?.travelDetails?.arrivalTime || '3:00 PM'}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[#A57865] mt-0.5" />
                  <div className="flex-1">
                    <div className="text-xs text-neutral-600 mb-1">Room Number</div>
                    <div className="text-sm font-medium text-neutral-900">
                      {typeof preCheckInData?.selectedRoom === 'object'
                        ? preCheckInData?.selectedRoom?.number
                        : preCheckInData?.selectedRoom || 'Assigned at check-in'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white border-2 border-neutral-200 rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">Contact Information</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-[#A57865] mt-0.5" />
                  <div className="flex-1">
                    <div className="text-xs text-neutral-600 mb-1">Email</div>
                    <div className="text-sm font-medium text-neutral-900">
                      {preCheckInData?.personalInfo?.email || 'Not provided'}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-[#A57865] mt-0.5" />
                  <div className="flex-1">
                    <div className="text-xs text-neutral-600 mb-1">Phone</div>
                    <div className="text-sm font-medium text-neutral-900">
                      {preCheckInData?.personalInfo?.phone || 'Not provided'}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Smartphone className="w-5 h-5 text-[#A57865] mt-0.5" />
                  <div className="flex-1">
                    <div className="text-xs text-neutral-600 mb-1">Confirmation Sent</div>
                    <div className="text-sm font-medium text-green-600">
                      Email & SMS confirmation sent
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Instructions Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-blue-50 border-2 border-blue-200 rounded-2xl shadow-lg p-6"
          >
            <h3 className="text-sm font-semibold text-blue-900 mb-3">What happens next?</h3>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">1.</span>
                <p className="text-sm text-blue-900">
                  <strong>Save your digital key</strong> - Download or screenshot the QR code above
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">2.</span>
                <p className="text-sm text-blue-900">
                  <strong>Skip the front desk</strong> - Go directly to your room upon arrival
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">3.</span>
                <p className="text-sm text-blue-900">
                  <strong>Scan to enter</strong> - Use your digital key at the room door
                </p>
              </div>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex gap-4 pt-4"
          >
            <button
              onClick={() => window.print()}
              className="flex-1 py-3 bg-white border-2 border-neutral-300 hover:border-[#A57865] text-neutral-900 font-medium rounded-2xl transition-all shadow-md"
            >
              Print Summary
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex-1 py-3 bg-[#A57865] hover:bg-[#8E6554] text-white font-medium rounded-2xl transition-all shadow-md"
            >
              Back to Home
            </button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
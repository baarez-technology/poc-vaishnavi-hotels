import jsPDF from 'jspdf';

interface BookingData {
  bookingNumber: string;
  room: {
    name: string;
    category: string;
    maxGuests: number;
    price: number;
  };
  checkIn: string;
  checkOut: string;
  guests: {
    adults: number;
    children: number;
  };
  guestInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  payment: {
    cardNumber: string;
    cardName: string;
  };
  subtotal: number;
  tax: number;
  serviceFee: number;
  total: number;
  nights: number;
  taxRate?: number;
  cgst?: number;
  sgst?: number;
  cgstRate?: number;
  sgstRate?: number;
}

export function generateBookingPDF(bookingData: BookingData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = margin;

  // Helper function to add text with word wrap
  const addText = (text: string, x: number, y: number, fontSize: number = 10, color: string = '#000000', align: 'left' | 'center' | 'right' = 'left') => {
    doc.setFontSize(fontSize);
    doc.setTextColor(color);
    const lines = doc.splitTextToSize(text, pageWidth - 2 * margin);
    doc.text(lines, x, y, { align });
    return y + (lines.length * fontSize * 0.4);
  };

  // Header
  doc.setFillColor(165, 120, 101); // Primary brown color
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor('#FFFFFF');
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('GLIMMORA', margin, 25);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Booking Confirmation', pageWidth - margin, 25, { align: 'right' });

  yPos = 50;

  // Title
  doc.setTextColor('#000000');
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  yPos = addText('Booking Confirmed!', margin, yPos, 20) + 5;

  // Confirmation Number
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  yPos = addText(`Confirmation Number: ${bookingData.bookingNumber}`, margin, yPos, 12) + 10;

  // Booking Details Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  yPos = addText('Reservation Details', margin, yPos, 14) + 5;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  yPos = addText(`Room: ${bookingData.room.name} (${bookingData.room.category})`, margin, yPos, 10) + 3;
  yPos = addText(`Check-in: ${new Date(bookingData.checkIn).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`, margin, yPos, 10) + 3;
  yPos = addText(`Check-out: ${new Date(bookingData.checkOut).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`, margin, yPos, 10) + 3;
  yPos = addText(`Nights: ${bookingData.nights}`, margin, yPos, 10) + 3;
  yPos = addText(`Guests: ${bookingData.guests.adults} Adult(s)${bookingData.guests.children > 0 ? `, ${bookingData.guests.children} Child(ren)` : ''}`, margin, yPos, 10) + 5;

  // Guest Information
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  yPos = addText('Guest Information', margin, yPos, 14) + 5;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  yPos = addText(`Name: ${bookingData.guestInfo.firstName} ${bookingData.guestInfo.lastName}`, margin, yPos, 10) + 3;
  yPos = addText(`Email: ${bookingData.guestInfo.email}`, margin, yPos, 10) + 3;
  yPos = addText(`Phone: ${bookingData.guestInfo.phone}`, margin, yPos, 10) + 5;

  // Payment Summary
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  yPos = addText('Payment Summary', margin, yPos, 14) + 5;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const gstLabel = bookingData.taxRate ? `GST (${bookingData.taxRate}%)` : 'GST';
  yPos = addText(`Room Rate: ₹${bookingData.room.price.toFixed(2)} × ${bookingData.nights} night(s) = ₹${bookingData.subtotal.toFixed(2)}`, margin, yPos, 10) + 3;
  yPos = addText(`Service Fee (5%): ₹${bookingData.serviceFee.toFixed(2)}`, margin, yPos, 10) + 3;
  yPos = addText(`${gstLabel}: ₹${bookingData.tax.toFixed(2)}`, margin, yPos, 10) + 3;
  if (bookingData.cgst !== undefined && bookingData.sgst !== undefined) {
    yPos = addText(`    CGST (${bookingData.cgstRate}%): ₹${bookingData.cgst.toFixed(2)}  |  SGST (${bookingData.sgstRate}%): ₹${bookingData.sgst.toFixed(2)}`, margin, yPos, 9, '#666666') + 3;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  yPos = addText(`Total Paid: ₹${bookingData.total.toFixed(2)}`, margin, yPos, 12) + 5;

  // Payment Method
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  yPos = addText(`Payment Method: •••• ${bookingData.payment.cardNumber.slice(-4)}`, margin, yPos, 10) + 3;
  yPos = addText(`Cardholder: ${bookingData.payment.cardName}`, margin, yPos, 10) + 10;

  // Footer
  const footerY = pageHeight - 30;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, footerY, pageWidth - margin, footerY);
  
  doc.setFontSize(8);
  doc.setTextColor('#666666');
  doc.text('Thank you for choosing Glimmora!', pageWidth / 2, footerY + 10, { align: 'center' });
  doc.text('For questions, contact: reservations@terrasuites.com', pageWidth / 2, footerY + 16, { align: 'center' });

  // Save PDF
  doc.save(`booking-confirmation-${bookingData.bookingNumber}.pdf`);
}


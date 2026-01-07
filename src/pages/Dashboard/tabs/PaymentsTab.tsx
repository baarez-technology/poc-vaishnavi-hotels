import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { CreditCard, Plus, Trash2, Receipt, Download, X } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { paymentMethodsService, type PaymentMethod as PaymentMethodType } from '@/api/services/payment-methods.service';

interface PaymentMethod {
  id: string | number;
  type: 'visa' | 'mastercard' | 'amex';
  last4: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
  cardholderName?: string;
}

interface BillingHistory {
  id: string;
  date: Date;
  description: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  invoiceUrl: string;
}

export function PaymentsTab() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCard, setNewCard] = useState({
    cardNumber: '',
    cardholderName: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    setAsDefault: false,
  });

  // Load payment methods from database
  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      setIsLoading(true);
      const methods = await paymentMethodsService.list();
      setPaymentMethods(methods.map(m => ({
        id: m.id,
        type: m.card_type,
        last4: m.last4,
        expiryMonth: m.expiry_month,
        expiryYear: m.expiry_year,
        isDefault: m.is_default,
        cardholderName: m.cardholder_name,
      })));
    } catch (error) {
      console.error('Failed to load payment methods:', error);
      toast.error('Failed to load payment methods');
    } finally {
      setIsLoading(false);
    }
  };

  const billingHistory: BillingHistory[] = [
    {
      id: '1',
      date: new Date('2025-01-10'),
      description: 'Ocean View Suite - Jan 15-18, 2025',
      amount: 1200,
      status: 'paid',
      invoiceUrl: '#',
    },
    {
      id: '2',
      date: new Date('2024-12-20'),
      description: 'Deluxe Room - Dec 20-23, 2024',
      amount: 900,
      status: 'paid',
      invoiceUrl: '#',
    },
    {
      id: '3',
      date: new Date('2024-11-10'),
      description: 'Premium Suite - Nov 10-13, 2024',
      amount: 1500,
      status: 'paid',
      invoiceUrl: '#',
    },
  ];

  const cardIcons = {
    visa: '💳',
    mastercard: '💳',
    amex: '💳',
  };

  const statusColors = {
    paid: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    failed: 'bg-red-100 text-red-700',
  };

  const handleAddCard = () => {
    setShowAddCardModal(true);
  };

  const detectCardType = (cardNumber: string): 'visa' | 'mastercard' | 'amex' => {
    const cleaned = cardNumber.replace(/\s/g, '');
    if (cleaned.startsWith('4')) return 'visa';
    if (cleaned.startsWith('5') || cleaned.startsWith('2')) return 'mastercard';
    if (cleaned.startsWith('3')) return 'amex';
    return 'visa'; // default
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    const groups = cleaned.match(/.{1,4}/g) || [];
    return groups.join(' ').substring(0, 19);
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setNewCard({ ...newCard, cardNumber: formatted });
  };

  const handleSubmitCard = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!newCard.cardNumber || newCard.cardNumber.replace(/\s/g, '').length < 13) {
      toast.error('Please enter a valid card number');
      return;
    }
    if (!newCard.cardholderName || newCard.cardholderName.length < 2) {
      toast.error('Please enter cardholder name');
      return;
    }
    if (!newCard.expiryMonth || !newCard.expiryYear) {
      toast.error('Please enter expiry date');
      return;
    }
    if (!newCard.cvv || newCard.cvv.length < 3) {
      toast.error('Please enter CVV');
      return;
    }

    setIsAddingCard(true);
    
    try {
      const cardNumber = newCard.cardNumber.replace(/\s/g, '');
      const last4 = cardNumber.slice(-4);
      const cardType = detectCardType(cardNumber);
      
      // Create payment method in database
      const created = await paymentMethodsService.create({
        card_type: cardType,
        last4: last4,
        expiry_month: parseInt(newCard.expiryMonth),
        expiry_year: parseInt(newCard.expiryYear),
        cardholder_name: newCard.cardholderName || undefined,
        is_default: newCard.setAsDefault || paymentMethods.length === 0,
      });
      
      // Reload payment methods
      await loadPaymentMethods();
      
      toast.success('Payment method added successfully!');
      setShowAddCardModal(false);
      setNewCard({
        cardNumber: '',
        cardholderName: '',
        expiryMonth: '',
        expiryYear: '',
        cvv: '',
        setAsDefault: false,
      });
    } catch (error: any) {
      console.error('Failed to add payment method:', error);
      toast.error(error?.response?.data?.detail || 'Failed to add payment method');
    } finally {
      setIsAddingCard(false);
    }
  };

  const handleRemoveCard = async (cardId: string | number) => {
    const card = paymentMethods.find(m => m.id === cardId);
    if (card?.isDefault) {
      toast.error('Cannot delete default payment method');
      return;
    }
    
    if (confirm('Are you sure you want to remove this payment method?')) {
      try {
        await paymentMethodsService.delete(Number(cardId));
        await loadPaymentMethods();
        toast.success('Payment method removed successfully!');
      } catch (error: any) {
        console.error('Failed to delete payment method:', error);
        toast.error(error?.response?.data?.detail || 'Failed to remove payment method');
      }
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Saved Payment Methods */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border border-neutral-200 rounded-xl p-6 bg-white"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-neutral-900">Saved Cards</h3>
          <button
            onClick={handleAddCard}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Card
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-neutral-500">Loading payment methods...</div>
        ) : paymentMethods.length === 0 ? (
          <div className="text-center py-8 text-neutral-500">No saved payment methods</div>
        ) : (
          <>
            <div className="space-y-3">
              {paymentMethods.map((method, index) => (
                <motion.div
                  key={method.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 + 0.1 }}
                  className="relative p-4 border border-neutral-200 rounded-lg hover:border-neutral-300 transition-colors"
                >
                  {method.isDefault && (
                    <span className="absolute top-4 right-4 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                      DEFAULT
                    </span>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center text-xl">
                        {cardIcons[method.type]}
                      </div>
                      <div>
                        <div className="font-medium text-neutral-900 capitalize text-sm">
                          {method.type} •••• {method.last4}
                        </div>
                        <div className="text-xs text-neutral-500">
                          Expires {method.expiryMonth.toString().padStart(2, '0')}/{method.expiryYear}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveCard(method.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      disabled={method.isDefault}
                      title={method.isDefault ? 'Cannot delete default card' : 'Delete card'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {!method.isDefault && (
                    <button 
                      onClick={async () => {
                        try {
                          await paymentMethodsService.update(Number(method.id), { is_default: true });
                          await loadPaymentMethods();
                          toast.success('Default payment method updated');
                        } catch (error: any) {
                          console.error('Failed to update default card:', error);
                          toast.error(error?.response?.data?.detail || 'Failed to update default card');
                        }
                      }}
                      className="mt-3 text-xs text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Set as default
                    </button>
                  )}
                </motion.div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-900">
                <strong>🔒 Secure:</strong> All payment information is encrypted and stored securely. We never store your full card number.
              </p>
            </div>
          </>
        )}
      </motion.div>

      {/* Billing History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="border border-neutral-200 rounded-xl p-6 bg-white"
      >
        <h3 className="text-lg font-semibold text-neutral-900 mb-6">Billing History</h3>

        <div className="space-y-3">
          {billingHistory.map((transaction, index) => (
            <motion.div
              key={transaction.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 + 0.2 }}
              className="p-4 border border-neutral-200 rounded-lg hover:border-neutral-300 transition-colors"
            >
              <div className="flex items-start justify-between mb-3 pb-3 border-b border-neutral-100">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-neutral-900 text-sm">{transaction.description}</h4>
                    <span className={`px-2 py-0.5 ${statusColors[transaction.status]} text-xs font-medium rounded capitalize`}>
                      {transaction.status}
                    </span>
                  </div>
                  <div className="text-xs text-neutral-500">
                    {format(transaction.date, 'MMM dd, yyyy')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-neutral-900">
                    ${transaction.amount.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button className="flex items-center gap-2 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors text-xs">
                  <Download className="w-3.5 h-3.5" />
                  Download Invoice
                </button>
                <button className="flex items-center gap-2 px-3 py-2 bg-white border border-neutral-300 hover:border-neutral-400 text-neutral-900 font-medium rounded-lg transition-colors text-xs">
                  View Details
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Total Spent */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="border border-neutral-200 rounded-xl p-6 bg-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-neutral-500 mb-1">Total Spent (All Time)</div>
            <div className="text-3xl font-bold text-neutral-900">
              ${billingHistory.reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
            </div>
          </div>
          <div className="w-12 h-12 bg-neutral-100 rounded-lg flex items-center justify-center">
            <Receipt className="w-6 h-6 text-neutral-600" />
          </div>
        </div>
      </motion.div>

      {/* Add Card Modal */}
      <AnimatePresence>
        {showAddCardModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddCardModal(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-neutral-200">
                  <h3 className="text-xl font-semibold text-neutral-900">Add Payment Method</h3>
                  <button
                    onClick={() => setShowAddCardModal(false)}
                    className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-neutral-600" />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmitCard} className="p-6 space-y-4">
                  {/* Card Number */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Card Number
                    </label>
                    <input
                      type="text"
                      value={newCard.cardNumber}
                      onChange={handleCardNumberChange}
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                      className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm"
                    />
                  </div>

                  {/* Cardholder Name */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      value={newCard.cardholderName}
                      onChange={(e) => setNewCard({ ...newCard, cardholderName: e.target.value })}
                      placeholder="John Doe"
                      className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm"
                    />
                  </div>

                  {/* Expiry and CVV */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Expiry Date
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={newCard.expiryMonth}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').substring(0, 2);
                            if (value === '' || (parseInt(value) >= 1 && parseInt(value) <= 12)) {
                              setNewCard({ ...newCard, expiryMonth: value });
                            }
                          }}
                          placeholder="MM"
                          maxLength={2}
                          className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm"
                        />
                        <input
                          type="text"
                          value={newCard.expiryYear}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').substring(0, 4);
                            setNewCard({ ...newCard, expiryYear: value });
                          }}
                          placeholder="YYYY"
                          maxLength={4}
                          className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        CVV
                      </label>
                      <input
                        type="text"
                        value={newCard.cvv}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').substring(0, 4);
                          setNewCard({ ...newCard, cvv: value });
                        }}
                        placeholder="123"
                        maxLength={4}
                        className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm"
                      />
                    </div>
                  </div>

                  {/* Set as Default */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="setAsDefault"
                      checked={newCard.setAsDefault}
                      onChange={(e) => setNewCard({ ...newCard, setAsDefault: e.target.checked })}
                      className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                    />
                    <label htmlFor="setAsDefault" className="text-sm text-neutral-700">
                      Set as default payment method
                    </label>
                  </div>

                  {/* Security Notice */}
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-900">
                      <strong>🔒 Secure:</strong> Your card information is encrypted and stored securely. We never store your full card number.
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddCardModal(false)}
                      className="flex-1 px-4 py-2.5 border border-neutral-300 text-neutral-900 font-medium rounded-lg hover:border-neutral-400 transition-colors text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isAddingCard}
                      className="flex-1 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-neutral-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors text-sm"
                    >
                      {isAddingCard ? 'Adding...' : 'Add Card'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
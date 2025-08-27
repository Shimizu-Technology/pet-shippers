import React, { useState } from 'react';
import { DollarSign, CreditCard, Plus, History, Receipt, AlertCircle, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { Input } from './ui/Input';
import { formatCurrency, formatDate, formatDateTime } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
// Convex imports
import { useMutation as useConvexMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface PaymentSectionProps {
  shipment: any; // We'll type this properly later
  isStaffOrAdmin: boolean;
  onPaymentUpdate: () => void;
}

interface LineItem {
  description: string;
  amountCents: number;
  category: 'shipping' | 'crate' | 'documentation' | 'insurance' | 'other';
}

export const PaymentSection: React.FC<PaymentSectionProps> = ({
  shipment,
  isStaffOrAdmin,
  onPaymentUpdate
}) => {
  const { user } = useAuth();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showLineItemsModal, setShowLineItemsModal] = useState(false);
  const [showPaymentHistoryModal, setShowPaymentHistoryModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [lineItems, setLineItems] = useState<LineItem[]>(shipment.lineItems || []);
  const [newLineItem, setNewLineItem] = useState<LineItem>({
    description: '',
    amountCents: 0,
    category: 'shipping'
  });

  // Convex mutations
  const updatePaymentInfo = useConvexMutation(api.shipmentPayments.updatePaymentInfo);
  const processPayment = useConvexMutation(api.shipmentPayments.processPayment);
  const processRefund = useConvexMutation(api.shipmentPayments.processRefund);

  // Calculate payment status
  const totalAmount = shipment.totalAmountCents || 0;
  const paidAmount = shipment.paidAmountCents || 0;
  const remainingAmount = Math.max(0, totalAmount - paidAmount);
  const paymentStatus = shipment.paymentStatus || 'pending';

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'refunded':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4" />;
      case 'partial':
        return <Clock className="w-4 h-4" />;
      case 'refunded':
        return <RefreshCw className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const handleProcessPayment = async () => {
    if (!paymentAmount || !user?.id) return;
    
    try {
      await processPayment({
        shipmentId: shipment._id as Id<"shipments">,
        amountCents: Math.round(parseFloat(paymentAmount) * 100),
        method: paymentMethod || undefined,
        transactionId: transactionId || undefined,
        processedBy: user.id,
        notes: paymentNotes || undefined,
      });
      
      setShowPaymentModal(false);
      setPaymentAmount('');
      setPaymentMethod('');
      setTransactionId('');
      setPaymentNotes('');
      onPaymentUpdate();
    } catch (error) {
      console.error('Payment processing failed:', error);
      alert('Failed to process payment. Please try again.');
    }
  };

  const handleUpdateLineItems = async () => {
    try {
      await updatePaymentInfo({
        shipmentId: shipment._id as Id<"shipments">,
        lineItems: lineItems,
      });
      
      setShowLineItemsModal(false);
      onPaymentUpdate();
    } catch (error) {
      console.error('Failed to update line items:', error);
      alert('Failed to update billing information. Please try again.');
    }
  };

  const addLineItem = () => {
    if (newLineItem.description && newLineItem.amountCents > 0) {
      setLineItems([...lineItems, newLineItem]);
      setNewLineItem({
        description: '',
        amountCents: 0,
        category: 'shipping'
      });
    }
  };

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const categoryLabels = {
    shipping: 'Shipping',
    crate: 'Crate',
    documentation: 'Documentation',
    insurance: 'Insurance',
    other: 'Other'
  };

  return (
    <>
      <div className="bg-green-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-[#0E2A47] mb-3 flex items-center">
          <DollarSign className="w-5 h-5 mr-2" />
          Payment & Billing
        </h3>

        {/* Payment Summary */}
        <div className="space-y-4">
          {/* Payment Status */}
          <div className="flex items-center justify-between p-3 bg-white rounded border">
            <div className="flex items-center space-x-3">
              {getPaymentStatusIcon(paymentStatus)}
              <div>
                <div className="font-medium text-sm">Payment Status</div>
                <div className="text-xs text-gray-500">
                  {paymentStatus === 'paid' ? 'Fully paid' :
                   paymentStatus === 'partial' ? 'Partially paid' :
                   paymentStatus === 'refunded' ? 'Refunded' :
                   'Payment pending'}
                </div>
              </div>
            </div>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getPaymentStatusColor(paymentStatus)}`}>
              {paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1)}
            </span>
          </div>

          {/* Amount Summary */}
          {totalAmount > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-white rounded border">
                <div className="text-xs text-gray-500 uppercase tracking-wider">Total Amount</div>
                <div className="text-lg font-semibold text-gray-900">
                  {formatCurrency(totalAmount)}
                </div>
              </div>
              <div className="p-3 bg-white rounded border">
                <div className="text-xs text-gray-500 uppercase tracking-wider">Paid Amount</div>
                <div className="text-lg font-semibold text-green-600">
                  {formatCurrency(paidAmount)}
                </div>
              </div>
              <div className="p-3 bg-white rounded border">
                <div className="text-xs text-gray-500 uppercase tracking-wider">Remaining</div>
                <div className="text-lg font-semibold text-orange-600">
                  {formatCurrency(remainingAmount)}
                </div>
              </div>
            </div>
          )}

          {/* Line Items Preview */}
          {lineItems && lineItems.length > 0 && (
            <div className="p-3 bg-white rounded border">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium">Billing Details</div>
                {isStaffOrAdmin && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowLineItemsModal(true)}
                    className="text-xs"
                  >
                    Edit
                  </Button>
                )}
              </div>
              <div className="space-y-1">
                {lineItems.slice(0, 3).map((item, index) => (
                  <div key={index} className="flex justify-between text-xs">
                    <span className="text-gray-600">{item.description}</span>
                    <span className="font-medium">{formatCurrency(item.amountCents)}</span>
                  </div>
                ))}
                {lineItems.length > 3 && (
                  <div className="text-xs text-gray-500 italic">
                    +{lineItems.length - 3} more items
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            {/* Client Payment Button */}
            {!isStaffOrAdmin && remainingAmount > 0 && (
              <Button
                onClick={() => {
                  // For testing purposes, simulate a successful payment
                  const confirmPayment = window.confirm(
                    `Simulate payment of ${formatCurrency(remainingAmount)}?\n\n` +
                    `In a real app, this would redirect to Stripe/PayPal/etc.\n` +
                    `Click OK to simulate successful payment.`
                  );
                  
                  if (confirmPayment && user?.id) {
                    // Simulate payment by calling the processPayment mutation
                    processPayment({
                      shipmentId: shipment._id as Id<"shipments">,
                      amountCents: remainingAmount,
                      method: 'stripe',
                      transactionId: `sim_${Date.now()}`,
                      processedBy: user.id,
                      notes: 'Simulated payment for testing',
                    }).then(() => {
                      alert('Payment successful! 🎉');
                      onPaymentUpdate();
                    }).catch((error) => {
                      console.error('Payment simulation failed:', error);
                      alert('Payment simulation failed. Please try again.');
                    });
                  }
                }}
                className="flex items-center"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Pay Now ({formatCurrency(remainingAmount)})
              </Button>
            )}

            {/* Staff/Admin Actions */}
            {isStaffOrAdmin && (
              <>
                {totalAmount === 0 && (
                  <Button
                    variant="outline"
                    onClick={() => setShowLineItemsModal(true)}
                    className="flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Set Billing Amount
                  </Button>
                )}
                
                {remainingAmount > 0 && (
                  <Button
                    onClick={() => setShowPaymentModal(true)}
                    className="flex items-center"
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    Record Payment
                  </Button>
                )}

                {shipment.paymentHistory && shipment.paymentHistory.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => setShowPaymentHistoryModal(true)}
                    className="flex items-center"
                  >
                    <History className="w-4 h-4 mr-2" />
                    Payment History
                  </Button>
                )}
              </>
            )}
          </div>

          {/* No billing info message */}
          {totalAmount === 0 && (
            <div className="text-center py-4 text-gray-500 bg-white rounded border">
              <p className="text-sm">
                {isStaffOrAdmin 
                  ? "No billing information set. Click 'Set Billing Amount' to add payment details."
                  : "Billing information will be available once quote is finalized"
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Record Payment"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Amount
            </label>
            <Input
              type="number"
              step="0.01"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder="0.00"
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Method (Optional)
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select method</option>
              <option value="stripe">Credit Card (Stripe)</option>
              <option value="paypal">PayPal</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cash">Cash</option>
              <option value="check">Check</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Transaction ID (Optional)
            </label>
            <Input
              type="text"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder="Transaction reference"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
              placeholder="Additional notes about this payment"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowPaymentModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleProcessPayment}
              disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
            >
              Record Payment
            </Button>
          </div>
        </div>
      </Modal>

      {/* Line Items Modal */}
      <Modal
        isOpen={showLineItemsModal}
        onClose={() => setShowLineItemsModal(false)}
        title="Billing Details"
        size="lg"
      >
        <div className="space-y-4">
          {/* Existing Line Items */}
          {lineItems.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Current Items</h4>
              <div className="space-y-2">
                {lineItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{item.description}</div>
                      <div className="text-xs text-gray-500">{categoryLabels[item.category]}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{formatCurrency(item.amountCents)}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeLineItem(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add New Line Item */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Add New Item</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Input
                  type="text"
                  value={newLineItem.description}
                  onChange={(e) => setNewLineItem({...newLineItem, description: e.target.value})}
                  placeholder="Description"
                  className="w-full"
                />
              </div>
              <div>
                <Input
                  type="number"
                  step="0.01"
                  value={newLineItem.amountCents / 100}
                  onChange={(e) => setNewLineItem({...newLineItem, amountCents: Math.round(parseFloat(e.target.value || '0') * 100)})}
                  placeholder="Amount"
                  className="w-full"
                />
              </div>
              <div>
                <select
                  value={newLineItem.category}
                  onChange={(e) => setNewLineItem({...newLineItem, category: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <Button
                  onClick={addLineItem}
                  disabled={!newLineItem.description || newLineItem.amountCents <= 0}
                  className="w-full"
                >
                  Add Item
                </Button>
              </div>
            </div>
          </div>

          {/* Total */}
          {lineItems.length > 0 && (
            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Total:</span>
                <span className="text-lg font-semibold">
                  {formatCurrency(lineItems.reduce((sum, item) => sum + item.amountCents, 0))}
                </span>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowLineItemsModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateLineItems}
            >
              Save Billing Details
            </Button>
          </div>
        </div>
      </Modal>

      {/* Payment History Modal */}
      <Modal
        isOpen={showPaymentHistoryModal}
        onClose={() => setShowPaymentHistoryModal(false)}
        title="Payment History"
      >
        <div className="space-y-3">
          {shipment.paymentHistory && shipment.paymentHistory.length > 0 ? (
            shipment.paymentHistory.map((payment: any, index: number) => (
              <div key={index} className="p-3 bg-gray-50 rounded border">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        payment.type === 'payment' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {payment.type === 'payment' ? 'Payment' : 'Refund'}
                      </span>
                      <span className="font-medium">
                        {formatCurrency(payment.amountCents)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatDateTime(new Date(payment.processedAt).toISOString())}
                    </div>
                    {payment.method && (
                      <div className="text-xs text-gray-500">
                        Method: {payment.method}
                      </div>
                    )}
                    {payment.transactionId && (
                      <div className="text-xs text-gray-500">
                        Transaction: {payment.transactionId}
                      </div>
                    )}
                    {payment.notes && (
                      <div className="text-xs text-gray-600 mt-1 italic">
                        {payment.notes}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">No payment history available</p>
          )}
        </div>
      </Modal>
    </>
  );
};

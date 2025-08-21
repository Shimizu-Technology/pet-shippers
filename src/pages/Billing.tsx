import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CreditCard, DollarSign, CheckCircle, Clock } from 'lucide-react';
import { http } from '../lib/http';
import { PaymentRequest } from '../types';
import { formatCurrency, formatDate } from '../lib/utils';
import { Layout } from '../components/Layout';
import { Button } from '../components/ui/Button';

export const BillingPage: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: paymentRequests, isLoading } = useQuery({
    queryKey: ['payment-requests'],
    queryFn: async () => {
      const response = await http.get('/payment_requests');
      return response.data.payment_requests as PaymentRequest[];
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: (paymentId: string) =>
      http.post(`/payments/${paymentId}/mark_paid`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-requests'] });
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  const handlePayNow = (paymentRequest: PaymentRequest) => {
    // In a real app, this would redirect to Stripe/payment processor
    const checkoutUrl = `https://checkout.stripe.com/pay/mock-${paymentRequest.id}`;
    
    // Simulate payment completion after a brief delay
    setTimeout(() => {
      markPaidMutation.mutate(paymentRequest.id);
    }, 1000);
    
    // Show mock checkout
    alert(`Redirecting to payment: ${checkoutUrl}\n\nPayment will be marked as completed automatically.`);
  };

  const pendingRequests = paymentRequests?.filter(pr => pr.status === 'requested') || [];
  const paidRequests = paymentRequests?.filter(pr => pr.status === 'paid') || [];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0E2A47] mb-2">Billing & Payments</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage your payment requests and billing history</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0">
                <p className="text-xl sm:text-2xl font-bold text-[#0E2A47]">{pendingRequests.length}</p>
                <p className="text-xs sm:text-sm text-gray-600">Pending Payments</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0">
                <p className="text-xl sm:text-2xl font-bold text-[#0E2A47]">{paidRequests.length}</p>
                <p className="text-xs sm:text-sm text-gray-600">Completed Payments</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#F3C0CF]/20 flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-[#0E2A47]" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-[#0E2A47] truncate">
                  {formatCurrency(
                    pendingRequests.reduce((sum, pr) => sum + pr.amountCents, 0)
                  )}
                </p>
                <p className="text-xs sm:text-sm text-gray-600">Outstanding Balance</p>
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[#0E2A47]"></div>
            <p className="mt-2 text-gray-600">Loading payment requests...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Pending Payments */}
            {pendingRequests.length > 0 && (
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-[#0E2A47] mb-3 sm:mb-4">Pending Payments</h2>
                <div className="space-y-3 sm:space-y-4">
                  {pendingRequests.map((request) => (
                    <div key={request.id} className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                              <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-medium text-[#0E2A47] text-sm sm:text-base">Payment Request</h3>
                              <p className="text-xs sm:text-sm text-gray-600 truncate">
                                Requested on {formatDate(request.createdAt)}
                              </p>
                            </div>
                          </div>
                          <p className="text-xl sm:text-2xl font-bold text-[#0E2A47] mb-2">
                            {formatCurrency(request.amountCents)}
                          </p>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                            Payment Required
                          </span>
                        </div>
                        <div className="sm:ml-6 flex-shrink-0">
                          <Button
                            onClick={() => handlePayNow(request)}
                            disabled={markPaidMutation.isPending}
                            className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto touch-manipulation"
                          >
                            {markPaidMutation.isPending ? 'Processing...' : 'Pay Now'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payment History */}
            {paidRequests.length > 0 && (
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-[#0E2A47] mb-3 sm:mb-4">Payment History</h2>
                <div className="bg-white shadow overflow-hidden rounded-lg">
                  <ul className="divide-y divide-gray-200">
                    {paidRequests.map((request) => (
                      <li key={request.id} className="px-4 sm:px-6 py-3 sm:py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 min-w-0 flex-1">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-medium text-[#0E2A47] text-sm sm:text-base">
                                {formatCurrency(request.amountCents)}
                              </h3>
                              <p className="text-xs sm:text-sm text-gray-600 truncate">
                                Paid on {formatDate(request.createdAt)}
                              </p>
                            </div>
                          </div>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 flex-shrink-0">
                            Paid
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Empty State */}
            {pendingRequests.length === 0 && paidRequests.length === 0 && (
              <div className="text-center py-12">
                <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">No payment requests</h3>
                <p className="mt-2 text-gray-600">
                  You don't have any payment requests at this time.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import ProfileSidebar from '../../components/ProfileSidebar';
import { useAuth } from '../../context/AuthContext';
import { getMyPayments, openRazorpayCheckout } from '../../lib/api';

const toDisplayStatus = (status) => {
  if (!status) return 'Created';
  return status
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const statusClasses = (status) => {
  const normalized = (status || '').toLowerCase();
  if (normalized === 'captured' || normalized === 'authorized') {
    return 'bg-green-100 text-green-700';
  }
  if (normalized === 'failed') {
    return 'bg-red-100 text-red-700';
  }
  if (normalized.includes('refund')) {
    return 'bg-amber-100 text-amber-700';
  }
  return 'bg-blue-100 text-blue-700';
};

export default function TransactionHistory() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchPayments = async () => {
    try {
      const response = await getMyPayments({ page: 1, limit: 50 });
      setPayments(response?.data?.items || []);
    } catch (error) {
      setMessage({ type: 'error', text: error?.data?.message || error.message || 'Failed to load transactions' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchPayments();
    }
    if (!authLoading && !isAuthenticated) {
      setLoading(false);
    }
  }, [authLoading, isAuthenticated]);

  const handleQuickPay = async () => {
    if (!isAuthenticated) {
      setMessage({ type: 'error', text: 'Please login to make a payment.' });
      return;
    }

    setPaying(true);
    setMessage({ type: '', text: '' });

    try {
      await openRazorpayCheckout({
        amount: 10,
        description: 'GOLO Test Payment',
        notes: {
          source: 'profile_transactions',
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
        },
      });

      setMessage({ type: 'success', text: 'Payment completed and verified successfully.' });
      await fetchPayments();
    } catch (error) {
      setMessage({ type: 'error', text: error?.data?.message || error.message || 'Payment was not completed.' });
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-white">
      <Navbar />
      <div className="flex w-full max-w-6xl mx-auto pt-5 pb-10 px-3 lg:flex-row lg:pt-8 lg:pb-16 lg:px-0">
        <div className="hidden lg:block">
          <ProfileSidebar />
        </div>
        <div className="min-w-0 flex-1 bg-white rounded-xl shadow-lg p-3 lg:p-8 lg:ml-8">
          <div className="flex flex-col items-stretch justify-between mb-6 gap-3 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#e0a12d] lg:hidden">Choja Payments</p>
              <h2 className="text-xl font-semibold text-[#157A4F] sm:text-2xl">Transaction History</h2>
            </div>
            <button
              type="button"
              onClick={handleQuickPay}
              disabled={paying || loading || !isAuthenticated}
              className="w-full px-4 py-2 rounded-lg bg-[#157A4F] text-white font-semibold hover:bg-[#0f5c3a] transition disabled:opacity-60 disabled:cursor-not-allowed sm:w-auto"
            >
              {paying ? 'Processing...' : 'Pay Rs. 10 (Test)'}
            </button>
          </div>

          {message.text && (
            <div
              className={`mb-4 p-3 rounded-lg text-sm font-semibold ${
                message.type === 'success'
                  ? 'bg-green-50 border border-green-200 text-green-700'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="w-full min-w-0 overflow-hidden rounded-2xl border border-gray-100 bg-white lg:hidden">
            {loading ? (
              <div className="p-5 text-center text-sm text-gray-500">
                Loading transactions...
              </div>
            ) : payments.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-500">
                No transactions found yet.
              </div>
            ) : (
              payments.map((tx) => (
                <Link
                  key={tx.paymentId}
                  href={`/profile/transactions/${tx.paymentId}`}
                  className="flex w-full min-w-0 items-center gap-3 border-b border-gray-100 px-3 py-3 last:border-b-0 active:bg-[#fffaf0]"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fff4d9] text-[11px] font-extrabold text-[#d99313]">
                    TX
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center justify-between gap-2">
                      <p className="truncate text-[13px] font-extrabold text-[#157A4F]">{tx.paymentId}</p>
                      <p className="shrink-0 text-[13px] font-extrabold text-green-700">Rs. {Number(tx.amount || 0).toFixed(2)}</p>
                    </div>
                    <div className="mt-1 flex min-w-0 items-center justify-between gap-2">
                      <p className="min-w-0 truncate text-[11px] text-gray-500">
                        {tx.method || 'Payment'} • {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : '-'}
                      </p>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold ${statusClasses(tx.status)}`}>
                        {toDisplayStatus(tx.status)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>

          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-green-50">
                  <th className="py-3 px-4">Payment ID</th>
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Payment Status</th>
                  <th className="py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody>
                {!loading && payments.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 px-4 text-center text-gray-500">
                      No transactions found yet.
                    </td>
                  </tr>
                )}

                {payments.map((tx) => (
                  <tr key={tx.paymentId} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="py-2 px-4">
                      <Link href={`/profile/transactions/${tx.paymentId}`} className="block text-[#157A4F] font-semibold hover:underline">
                        {tx.paymentId}
                      </Link>
                    </td>
                    <td className="py-2 px-4">{tx.razorpayOrderId || '-'}</td>
                    <td className="py-2 px-4">{tx.method || '-'}</td>
                    <td className="py-2 px-4 font-bold text-green-700">Rs. {Number(tx.amount || 0).toFixed(2)}</td>
                    <td className="py-2 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${statusClasses(tx.status)}`}
                      >
                        {toDisplayStatus(tx.status)}
                      </span>
                    </td>
                    <td className="py-2 px-4">{new Date(tx.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

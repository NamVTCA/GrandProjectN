import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { toast } from 'react-toastify';
import axios from 'axios';
import './TopUpPage.scss';
import CoinPackageCard from './CoinPackageCard';

interface CoinPackage {
  _id: string;
  packageId: string;
  name: string;
  coinsAmount: number;
  price: number;
  currency: string;
}

interface CheckoutFormProps {
  selectedPackage: CoinPackage;
  onSuccess: (orderId: string) => void;
  onCancel: () => void;
}

interface PaymentIntentResponse {
  clientSecret: string;
}

interface FulfillPaymentResponse {
  message: string;
  orderId: string;
}

// --- Stripe init ---
const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
if (!stripeKey) {
  console.error("⚠️ Stripe publishable key chưa được cấu hình trong .env");
}
const stripePromise = loadStripe(stripeKey!);

// --- API base url ---
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8888/api';

/* -------------------------------------------------------
   Form thanh toán
------------------------------------------------------- */
const CheckoutForm: React.FC<CheckoutFormProps> = ({ selectedPackage, onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Bạn cần đăng nhập để thực hiện thanh toán.');

      const response = await fetch(`${API_BASE_URL}/payments/create-payment-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        credentials: 'include',
        body: JSON.stringify({ packageId: selectedPackage.packageId }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || 'Lỗi khi tạo yêu cầu thanh toán.');
      }

      const { clientSecret }: PaymentIntentResponse = await response.json();
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
          billing_details: {
            name: "Khách hàng",
          },
        },
      });

      if (result.error) {
        toast.error(result.error.message || 'Thanh toán thất bại');
      } else if (result.paymentIntent && result.paymentIntent.status === 'succeeded') {
        const fulfillRes = await fetch(`${API_BASE_URL}/payments/fulfill-payment`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          credentials: 'include',
          body: JSON.stringify({ paymentIntentId: result.paymentIntent.id }),
        });

        if (!fulfillRes.ok) {
          const errData = await fulfillRes.json().catch(() => ({}));
          throw new Error(errData.message || 'Lỗi khi hoàn tất đơn hàng.');
        }

        const fulfillData: FulfillPaymentResponse = await fulfillRes.json();
        onSuccess(fulfillData.orderId);
      } else {
        toast.error('Thanh toán không thành công.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Đã xảy ra lỗi trong quá trình thanh toán.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="payment-form">
      <h3>Thông tin thanh toán</h3>
      <div className="card-element-container">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': { color: '#aab7c4' },
              },
            },
          }}
        />
      </div>
      {error && <div className="error-message">{error}</div>}
      <div className="button-group">
        <button type="button" onClick={onCancel} disabled={processing}>
          Hủy
        </button>
        <button type="submit" disabled={!stripe || processing}>
          {processing ? 'Đang xử lý...' : `Thanh toán ${selectedPackage.price.toLocaleString()} ${selectedPackage.currency}`}
        </button>
      </div>
    </form>
  );
};

/* -------------------------------------------------------
   Component hiển thị thành công
------------------------------------------------------- */
interface TopUpSuccessProps {
  lastOrderId: string | null;
  onDownloadReceipt: () => void;
  onBuyMore: () => void;
}

const TopUpSuccess: React.FC<TopUpSuccessProps> = ({ lastOrderId, onDownloadReceipt, onBuyMore }) => (
  <div className="topup-page payment-success-message">
    <h2>Thanh toán thành công!</h2>
    <p>Coin đã được thêm vào tài khoản của bạn.</p>
    <div className="button-group">
      {lastOrderId && (
        <button onClick={onDownloadReceipt} className="download-button">
          Tải Hóa đơn (PDF)
        </button>
      )}
      <button onClick={onBuyMore} className="buy-more-button">
        Mua thêm Coin
      </button>
    </div>
  </div>
);

/* -------------------------------------------------------
   Trang TopUpPage
------------------------------------------------------- */
const TopUpPage: React.FC = () => {
  const [packages, setPackages] = useState<CoinPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<CoinPackage | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/coin-packages`, { credentials: 'include' });
      if (!res.ok) throw new Error('Lỗi khi tải các gói coin.');
      const data: CoinPackage[] = await res.json();
      setPackages(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePackageSelect = (pkg: CoinPackage) => {
    setSelectedPackage(pkg);
    setPaymentSuccess(false);
    setLastOrderId(null);
  };

  const handlePaymentSuccess = (orderId: string) => {
    setPaymentSuccess(true);
    setLastOrderId(orderId);
    setSelectedPackage(null);
    toast.success('Thanh toán thành công! Coin đã được thêm vào tài khoản của bạn.');
  };

  const handleDownloadReceipt = async () => {
    if (!lastOrderId) return toast.error('Không tìm thấy ID hóa đơn để tải.');
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Vui lòng đăng nhập lại.');

      const res = await axios.get<ArrayBuffer>(`${API_BASE_URL}/payments/receipt/${lastOrderId}`, {
        responseType: 'arraybuffer',
        headers: { Authorization: `Bearer ${token}` },
      });

      const blob = new Blob([res.data as ArrayBuffer], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `receipt-${lastOrderId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Hóa đơn đang được tải về!');
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi tải hóa đơn.');
    }
  };

  if (loading) {
    return (
      <div className="topup-page">
        <h2>Mua Coin</h2>
        <div className="loading">Đang tải các gói coin...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="topup-page">
        <h2>Mua Coin</h2>
        <div className="error-message">Lỗi: {error}</div>
        <button onClick={fetchPackages}>Thử lại</button>
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <TopUpSuccess
        lastOrderId={lastOrderId}
        onDownloadReceipt={handleDownloadReceipt}
        onBuyMore={() => setPaymentSuccess(false)}
      />
    );
  }

  return (
    <div className="topup-page">
      <h2>Mua Coin</h2>

      <div className="coin-packages-grid">
        {packages.map((pkg) => (
          <CoinPackageCard
            key={pkg._id}
            coinPackage={pkg}
            isSelected={selectedPackage?._id === pkg._id}
            onSelect={() => handlePackageSelect(pkg)}
          />
        ))}
      </div>

      {selectedPackage && (
        <Elements stripe={stripePromise}>
          <CheckoutForm
            selectedPackage={selectedPackage}
            onSuccess={handlePaymentSuccess}
            onCancel={() => setSelectedPackage(null)}
          />
        </Elements>
      )}
    </div>
  );
};

export default TopUpPage;

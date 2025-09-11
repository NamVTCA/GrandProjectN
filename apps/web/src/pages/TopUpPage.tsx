import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import './TopUpPage.scss';
import CoinPackageCard from './CoinPackageCard';

// Define types
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
  onSuccess: () => void;
  onCancel: () => void;
}

interface PaymentIntentResponse {
  clientSecret: string;
  orderId: string;
}

// Load Stripe with the publishable key from environment variables
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// ✅ Define API base URL safely
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8888/api";

const CheckoutForm: React.FC<CheckoutFormProps> = ({ selectedPackage, onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Bạn cần đăng nhập để thực hiện thanh toán.");
      }

      // Create payment intent
      const response = await fetch(`${API_BASE_URL}/payments/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          packageId: selectedPackage.packageId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create payment intent');
      }

      const { clientSecret, orderId }: PaymentIntentResponse = await response.json();

      // Confirm card payment
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
          billing_details: {},
        },
      });

      if (result.error) {
        setError(result.error.message || 'Payment failed');
      } else if (result.paymentIntent && result.paymentIntent.status === 'succeeded') {
        // Payment succeeded, now call the backend to fulfill the order
        const fulfillResponse = await fetch(`${API_BASE_URL}/payments/fulfill-payment`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          credentials: 'include',
          body: JSON.stringify({
            paymentIntentId: result.paymentIntent.id,
          }),
        });

        if (!fulfillResponse.ok) {
          const errorData = await fulfillResponse.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to fulfill order');
        }

        onSuccess();
      } else {
        setError('Payment did not succeed.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during payment');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="payment-form">
      <h3>Payment Details</h3>
      <div className="card-element-container">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
            },
          }}
        />
      </div>
      {error && <div className="error-message">{error}</div>}
      <div className="button-group">
        <button type="button" onClick={onCancel} disabled={processing}>
          Cancel
        </button>
        <button type="submit" disabled={!stripe || processing}>
          {processing ? 'Processing...' : `Pay ₫${selectedPackage.price}`}
        </button>
      </div>
    </form>
  );
};

const TopUpPage: React.FC = () => {
  const [packages, setPackages] = useState<CoinPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<CoinPackage | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/coin-packages`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch packages');
      }

      const data: CoinPackage[] = await response.json();
      setPackages(data);
    } catch (error: any) {
      console.error('Failed to fetch packages:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePackageSelect = (pkg: CoinPackage) => {
    setSelectedPackage(pkg);
    setPaymentSuccess(false);
  };

  const handlePaymentSuccess = () => {
    setPaymentSuccess(true);
    setSelectedPackage(null);
    // You might want to refresh user coin balance here
  };

  if (loading) {
    return (
      <div className="topup-page">
        <h2>Buy Coins</h2>
        <div className="loading">Loading packages...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="topup-page">
        <h2>Buy Coins</h2>
        <div className="error-message">Error: {error}</div>
        <button onClick={fetchPackages}>Try Again</button>
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="topup-page">
        <h2>Payment Successful!</h2>
        <p>Your coins have been added to your account.</p>
        <button onClick={() => setPaymentSuccess(false)}>Buy More Coins</button>
      </div>
    );
  }

  return (
    <div className="topup-page">
      <h2>Buy Coins</h2>

      <div className="coin-packages-grid">
        {packages.map((pkg) => (
          <CoinPackageCard
            key={pkg._id}
            coinPackage={pkg}
            isSelected={selectedPackage !== null && selectedPackage._id === pkg._id}
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
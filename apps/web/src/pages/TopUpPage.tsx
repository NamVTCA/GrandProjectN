import React, { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import api from '../services/api';
import './TopUpPage.scss';
import CoinPackageCard from './CoinPackageCard';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY!);

const CheckoutForm: React.FC<{ clientSecret: string; orderId: string }> = ({
  clientSecret,
  orderId
}) => {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + '/top-up/success',
      },
      redirect: 'if_required',
    });

    if (result.error) {
      alert(result.error.message);
    } else if (result.paymentIntent?.status === 'succeeded') {
      await api.post('/payments/webhook/success', { orderId });
      alert('Thanh toán thành công!');
      window.location.href = '/shop';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="payment-form">
      <PaymentElement />
      <button type="submit" disabled={!stripe}>
        Thanh toán
      </button>
    </form>
  );
};

const TopUpPage: React.FC = () => {
  const [packages, setPackages] = useState<any[]>([]);
  const [clientSecret, setClientSecret] = useState('');
  const [orderId, setOrderId] = useState('');

  useEffect(() => {
    const fetchPackages = async () => {
      const res = await api.get('/coin-packages');
      setPackages(res.data);
    };
    fetchPackages();
  }, []);

  const handleSelect = async (packageId: string) => {
    const res = await api.post('/payments/create-payment-intent', {
      packageId
    });
    setClientSecret(res.data.clientSecret);
    setOrderId(res.data.orderId);
  };

  return (
    <div className="topup-page">
      <h2>Nạp Coin</h2>

      {!clientSecret && (
        <div className="coin-packages-grid">
          {packages.map((pkg, index) => (
            <CoinPackageCard
              key={pkg.packageId}
              coinAmount={pkg.coinsAmount}
              price={pkg.price}
              currency={pkg.currency}
              onSelect={() => handleSelect(pkg.packageId)}
              highlight={index === 1}
            />
          ))}
        </div>
      )}

      {clientSecret && (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <CheckoutForm clientSecret={clientSecret} orderId={orderId} />
        </Elements>
      )}
    </div>
  );
};

export default TopUpPage;

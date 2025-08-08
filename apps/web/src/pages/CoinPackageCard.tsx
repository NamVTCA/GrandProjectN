// src/features/payments/components/CoinPackageCard.tsx
import React from 'react';
import './CoinPackageCard.scss';
import { Coins } from 'lucide-react';

interface Props {
  coinAmount: number;
  price: number; // đơn vị cents (VD: 10000 = 100.00)
  currency: string;
  onSelect: () => void;
  highlight?: boolean;
}

const CoinPackageCard: React.FC<Props> = ({
  coinAmount,
  price,
  currency,
  onSelect,
  highlight,
}) => {
  return (
    <div className={`coin-package-card ${highlight ? 'highlight' : ''}`}>
      <div className="coin-icon">
        <Coins size={28} strokeWidth={2.5} />
      </div>
      <div className="coin-info">
        <h3>{coinAmount.toLocaleString()} Coins</h3>
        <p className="price">
          {(price / 100).toFixed(2)} {currency}
        </p>
      </div>
      <button onClick={onSelect}>Nạp ngay</button>
    </div>
  );
};

export default CoinPackageCard;

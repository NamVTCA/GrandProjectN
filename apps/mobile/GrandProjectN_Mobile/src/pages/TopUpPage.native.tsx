import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';
import Toast from 'react-native-toast-message';
import axios from 'axios';
import CoinPackageCard from './CoinPackageCard.native';

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

const API_BASE_URL = 'http://localhost:8888/api';

const CheckoutForm: React.FC<CheckoutFormProps> = ({ selectedPackage, onSuccess, onCancel }) => {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(false);

  const initializePaymentSheet = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Bạn cần đăng nhập để thực hiện thanh toán.');

      const response = await fetch(`${API_BASE_URL}/payments/create-payment-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ packageId: selectedPackage.packageId }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || 'Lỗi khi tạo yêu cầu thanh toán.');
      }

      const { clientSecret }: PaymentIntentResponse = await response.json();

      const { error } = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: 'Your App Name',
      });

      if (error) {
        Toast.show({
          type: 'error',
          text1: error.message,
        });
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: error.message,
      });
    }
  };

  const openPaymentSheet = async () => {
    setLoading(true);
    const { error } = await presentPaymentSheet();

    if (error) {
      Toast.show({
        type: 'error',
        text1: error.message,
      });
    } else {
      try {
        const token = localStorage.getItem('token');
        const fulfillRes = await fetch(`${API_BASE_URL}/payments/fulfill-payment`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ paymentIntentId: 'TODO' }), // You'll need to get the payment intent ID
        });

        if (!fulfillRes.ok) {
          const errData = await fulfillRes.json().catch(() => ({}));
          throw new Error(errData.message || 'Lỗi khi hoàn tất đơn hàng.');
        }

        const fulfillData: FulfillPaymentResponse = await fulfillRes.json();
        onSuccess(fulfillData.orderId);
      } catch (error: any) {
        Toast.show({
          type: 'error',
          text1: error.message,
        });
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    initializePaymentSheet();
  }, []);

  return (
    <View style={styles.paymentForm}>
      <Text style={styles.formTitle}>Thông tin thanh toán</Text>
      <View style={styles.buttonGroup}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel} disabled={loading}>
          <Text style={styles.buttonText}>Hủy</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.payButton} onPress={openPaymentSheet} disabled={loading}>
          <Text style={styles.buttonText}>
            {loading ? 'Đang xử lý...' : `Thanh toán $${selectedPackage.price}`}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const TopUpSuccess: React.FC<{
  lastOrderId: string | null;
  onDownloadReceipt: () => void;
  onBuyMore: () => void;
}> = ({ lastOrderId, onDownloadReceipt, onBuyMore }) => (
  <View style={styles.successContainer}>
    <Text style={styles.successTitle}>Thanh toán thành công!</Text>
    <Text style={styles.successText}>Coin đã được thêm vào tài khoản của bạn.</Text>
    <View style={styles.successButtonGroup}>
      {lastOrderId && (
        <TouchableOpacity style={styles.downloadButton} onPress={onDownloadReceipt}>
          <Text style={styles.buttonText}>Tải Hóa đơn (PDF)</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity style={styles.buyMoreButton} onPress={onBuyMore}>
        <Text style={styles.buttonText}>Mua thêm Coin</Text>
      </TouchableOpacity>
    </View>
  </View>
);

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
      const res = await fetch(`${API_BASE_URL}/coin-packages`);
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
    Toast.show({
      type: 'success',
      text1: 'Thanh toán thành công! Coin đã được thêm vào tài khoản của bạn.',
    });
  };

  const handleDownloadReceipt = async () => {
    if (!lastOrderId) {
      Toast.show({
        type: 'error',
        text1: 'Không tìm thấy ID hóa đơn để tải.',
      });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Vui lòng đăng nhập lại.');

      // In React Native, you would use a library like react-native-blob-util
      // to handle file downloads, or open the PDF in a WebView
      Toast.show({
        type: 'info',
        text1: 'Tính năng tải hóa đơn sẽ được triển khai sau',
      });
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: err.message || 'Lỗi khi tải hóa đơn.',
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Mua Coin</Text>
        <Text style={styles.loadingText}>Đang tải các gói coin...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Mua Coin</Text>
        <Text style={styles.errorText}>Lỗi: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchPackages}>
          <Text style={styles.buttonText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
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
    <View style={styles.container}>
      <Text style={styles.title}>Mua Coin</Text>

      <ScrollView contentContainerStyle={styles.packagesGrid}>
        {packages.map((pkg) => (
          <CoinPackageCard
            key={pkg._id}
            coinPackage={pkg}
            isSelected={selectedPackage?._id === pkg._id}
            onSelect={() => handlePackageSelect(pkg)}
          />
        ))}
      </ScrollView>

      {selectedPackage && (
        <CheckoutForm
          selectedPackage={selectedPackage}
          onSuccess={handlePaymentSuccess}
          onCancel={() => setSelectedPackage(null)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#1e1e1e',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4caf50',
    textAlign: 'center',
    marginBottom: 20,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#e0e0e0',
  },
  errorText: {
    color: '#ff6b6b',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  packagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  paymentForm: {
    marginTop: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    backgroundColor: '#2a2a2a',
  },
  formTitle: {
    textAlign: 'center',
    color: '#fafafa',
    marginBottom: 16,
    fontSize: 18,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#4a4a4a',
    borderRadius: 8,
    alignItems: 'center',
  },
  payButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#007bff',
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1e1e1e',
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#4caf50',
    marginBottom: 12,
  },
  successText: {
    color: '#b0b0b0',
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  successButtonGroup: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  downloadButton: {
    padding: 16,
    backgroundColor: '#4caf50',
    borderRadius: 12,
    minWidth: 160,
    alignItems: 'center',
  },
  buyMoreButton: {
    padding: 16,
    backgroundColor: '#616161',
    borderRadius: 12,
    minWidth: 160,
    alignItems: 'center',
  },
});

export default TopUpPage;
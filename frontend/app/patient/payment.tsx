import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8001';

interface PaymentData {
  payment_id: string;
  qr_code: string;
  amount: number;
  appointment_id: string;
  status: string;
  expires_at: string;
}

export default function PaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const appointmentId = params.appointmentId as string;
  const amount = parseFloat(params.amount as string);
  const gateway = params.gateway as string;

  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    createPayment();
  }, []);

  const createPayment = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const response = await axios.post(
        `${API_URL}/api/payments/create`,
        {
          appointment_id: appointmentId,
          amount: amount,
          gateway: gateway,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setPaymentData(response.data);
    } catch (error) {
      console.error('Error creating payment:', error);
      Alert.alert('Lỗi', 'Không thể tạo thanh toán. Vui lòng thử lại.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = async () => {
    try {
      setChecking(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(
        `${API_URL}/api/payments/status/${paymentData?.payment_id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.status === 'paid') {
        Alert.alert(
          'Thành công',
          'Thanh toán đã được xác nhận!',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/patient/appointments'),
            },
          ]
        );
      } else if (response.data.status === 'expired') {
        Alert.alert('Hết hạn', 'Mã thanh toán đã hết hạn. Vui lòng tạo lại.');
        router.back();
      } else {
        Alert.alert('Thông báo', 'Chưa nhận được thanh toán. Vui lòng thử lại sau vài giây.');
      }
    } catch (error) {
      console.error('Error checking payment:', error);
      Alert.alert('Lỗi', 'Không thể kiểm tra trạng thái thanh toán');
    } finally {
      setChecking(false);
    }
  };

  const confirmPaymentManually = async () => {
    Alert.alert(
      'Xác nhận thanh toán',
      'Bạn đã hoàn tất thanh toán chưa?',
      [
        { text: 'Chưa', style: 'cancel' },
        {
          text: 'Đã thanh toán',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              await axios.post(
                `${API_URL}/api/payments/confirm/${appointmentId}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
              );
              Alert.alert(
                'Thành công',
                'Thanh toán đã được xác nhận!',
                [
                  {
                    text: 'OK',
                    onPress: () => router.replace('/patient/appointments'),
                  },
                ]
              );
            } catch (error) {
              Alert.alert('Lỗi', 'Không thể xác nhận thanh toán');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Đang tạo mã thanh toán...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#2C3E50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thanh toán</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Gateway Info */}
        <View style={styles.gatewayCard}>
          <View style={styles.gatewayHeader}>
            <View style={styles.gatewayIcon}>
              <Ionicons name="card-outline" size={32} color="#4A90E2" />
            </View>
            <View style={styles.gatewayInfo}>
              <Text style={styles.gatewayName}>
                {gateway === 'vnpay' ? 'VNPay' : gateway === 'momo' ? 'MoMo' : 'ZaloPay'}
              </Text>
              <Text style={styles.gatewayDesc}>Quét mã QR để thanh toán</Text>
            </View>
          </View>
        </View>

        {/* Amount */}
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Số tiền thanh toán</Text>
          <Text style={styles.amountValue}>{amount.toLocaleString()} VNĐ</Text>
        </View>

        {/* QR Code */}
        <View style={styles.qrCard}>
          <Text style={styles.qrTitle}>Quét mã QR để thanh toán</Text>
          <View style={styles.qrContainer}>
            {paymentData && (
              <QRCode
                value={paymentData.qr_code}
                size={240}
                backgroundColor="white"
                color="black"
              />
            )}
          </View>
          <Text style={styles.qrHint}>
            Mở ứng dụng {gateway === 'vnpay' ? 'VNPay' : gateway === 'momo' ? 'MoMo' : 'ZaloPay'} và quét mã QR
          </Text>
          
          {/* Payment ID */}
          <View style={styles.paymentIdContainer}>
            <Text style={styles.paymentIdLabel}>Mã giao dịch:</Text>
            <Text style={styles.paymentIdValue}>{paymentData?.payment_id}</Text>
          </View>

          {/* Timer */}
          <View style={styles.timerContainer}>
            <Ionicons name="time-outline" size={16} color="#E74C3C" />
            <Text style={styles.timerText}>Mã QR có hiệu lực trong 15 phút</Text>
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>Hướng dẫn thanh toán</Text>
          <View style={styles.instructionStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={styles.stepText}>
              Mở ứng dụng {gateway === 'vnpay' ? 'VNPay' : gateway === 'momo' ? 'MoMo' : 'ZaloPay'} trên điện thoại
            </Text>
          </View>
          <View style={styles.instructionStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={styles.stepText}>Chọn tính năng quét mã QR</Text>
          </View>
          <View style={styles.instructionStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={styles.stepText}>Quét mã QR phía trên</Text>
          </View>
          <View style={styles.instructionStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>4</Text>
            </View>
            <Text style={styles.stepText}>Xác nhận và hoàn tất thanh toán</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.checkButton}
            onPress={checkPaymentStatus}
            disabled={checking}
          >
            {checking ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
                <Text style={styles.checkButtonText}>Kiểm tra thanh toán</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.confirmButton}
            onPress={confirmPaymentManually}
          >
            <Ionicons name="checkmark-done-outline" size={20} color="#27AE60" />
            <Text style={styles.confirmButtonText}>Đã thanh toán</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#7F8C8D',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  gatewayCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gatewayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gatewayIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  gatewayInfo: {
    flex: 1,
  },
  gatewayName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2C3E50',
  },
  gatewayDesc: {
    fontSize: 14,
    color: '#7F8C8D',
    marginTop: 4,
  },
  amountCard: {
    backgroundColor: '#4A90E2',
    padding: 24,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  amountValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 8,
  },
  qrCard: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  qrTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 24,
  },
  qrContainer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8EAED',
  },
  qrHint: {
    fontSize: 14,
    color: '#7F8C8D',
    marginTop: 20,
    textAlign: 'center',
  },
  paymentIdContainer: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    width: '100%',
  },
  paymentIdLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    marginBottom: 4,
  },
  paymentIdValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    padding: 12,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
  },
  timerText: {
    fontSize: 14,
    color: '#E74C3C',
    fontWeight: '500',
  },
  instructionsCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 16,
  },
  instructionStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#2C3E50',
    lineHeight: 20,
    paddingTop: 4,
  },
  actions: {
    gap: 12,
  },
  checkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4A90E2',
    paddingVertical: 16,
    borderRadius: 12,
  },
  checkButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#27AE60',
    paddingVertical: 16,
    borderRadius: 12,
  },
  confirmButtonText: {
    color: '#27AE60',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 40,
  },
});

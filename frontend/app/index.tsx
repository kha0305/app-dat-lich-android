import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="medical" size={80} color="#4A90E2" />
        <Text style={styles.title}>Clinic Booking</Text>
        <Text style={styles.subtitle}>Đặt lịch khám bệnh nhanh chóng & dễ dàng</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.featureCard}>
          <Ionicons name="calendar" size={32} color="#4A90E2" />
          <Text style={styles.featureTitle}>Đặt lịch dễ dàng</Text>
          <Text style={styles.featureText}>Chọn bác sĩ và thời gian phù hợp</Text>
        </View>

        <View style={styles.featureCard}>
          <Ionicons name="chatbubbles" size={32} color="#4A90E2" />
          <Text style={styles.featureTitle}>Chat với bác sĩ</Text>
          <Text style={styles.featureText}>Tư vấn trực tuyến real-time</Text>
        </View>

        <View style={styles.featureCard}>
          <Ionicons name="card" size={32} color="#4A90E2" />
          <Text style={styles.featureTitle}>Thanh toán online</Text>
          <Text style={styles.featureText}>VNPay, MoMo, ZaloPay</Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => router.push('/login')}
        >
          <Text style={styles.loginButtonText}>Đăng nhập</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.registerButton}
          onPress={() => router.push('/register')}
        >
          <Text style={styles.registerButtonText}>Đăng ký</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#7F8C8D',
    marginTop: 8,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    marginTop: 20,
  },
  featureCard: {
    backgroundColor: '#F8F9FA',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginTop: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#7F8C8D',
    marginTop: 4,
    textAlign: 'center',
  },
  buttonContainer: {
    marginBottom: 40,
  },
  loginButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  registerButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4A90E2',
  },
  registerButtonText: {
    color: '#4A90E2',
    fontSize: 16,
    fontWeight: '600',
  },
});

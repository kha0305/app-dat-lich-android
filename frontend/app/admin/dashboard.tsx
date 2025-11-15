import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8001';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

interface Appointment {
  id: string;
  patient_name: string;
  doctor_name: string;
  appointment_date: string;
  appointment_time: string;
  specialization: string;
  status: string;
  payment_status: string;
  amount: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadUserData();
    loadAppointments();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadAppointments = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`${API_URL}/api/appointments`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setAppointments(response.data);
    } catch (error) {
      console.error('Error loading appointments:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAppointments();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        onPress: async () => {
          await AsyncStorage.clear();
          router.replace('/');
        },
      },
    ]);
  };

  const stats = {
    total: appointments.length,
    pending: appointments.filter((a) => a.status === 'pending').length,
    confirmed: appointments.filter((a) => a.status === 'confirmed').length,
    completed: appointments.filter((a) => a.status === 'completed').length,
    revenue: appointments
      .filter((a) => a.payment_status === 'paid')
      .reduce((sum, a) => sum + a.amount, 0),
  };

  const recentAppointments = appointments.slice(0, 5);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Quản trị viên</Text>
          <Text style={styles.userName}>{user?.full_name}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={28} color="#2C3E50" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tổng quan hệ thống</Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: '#4A90E2' }]}>
              <Ionicons name="calendar-outline" size={32} color="#FFFFFF" />
              <Text style={styles.statNumber}>{stats.total}</Text>
              <Text style={styles.statLabel}>Tổng lịch hẹn</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#F39C12' }]}>
              <Ionicons name="time-outline" size={32} color="#FFFFFF" />
              <Text style={styles.statNumber}>{stats.pending}</Text>
              <Text style={styles.statLabel}>Chờ xác nhận</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#27AE60' }]}>
              <Ionicons name="checkmark-circle-outline" size={32} color="#FFFFFF" />
              <Text style={styles.statNumber}>{stats.confirmed}</Text>
              <Text style={styles.statLabel}>Đã xác nhận</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#3498DB' }]}>
              <Ionicons name="checkmark-done-outline" size={32} color="#FFFFFF" />
              <Text style={styles.statNumber}>{stats.completed}</Text>
              <Text style={styles.statLabel}>Hoàn thành</Text>
            </View>
          </View>

          <View style={styles.revenueCard}>
            <View>
              <Text style={styles.revenueLabel}>Doanh thu</Text>
              <Text style={styles.revenueAmount}>
                {stats.revenue.toLocaleString()} VNĐ
              </Text>
            </View>
            <Ionicons name="cash-outline" size={40} color="#27AE60" />
          </View>
        </View>

        {/* Recent Appointments */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lịch hẹn gần đây</Text>
          {recentAppointments.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={60} color="#95A5A6" />
              <Text style={styles.emptyText}>Chưa có lịch hẹn nào</Text>
            </View>
          ) : (
            recentAppointments.map((appointment) => (
              <View key={appointment.id} style={styles.appointmentCard}>
                <View style={styles.appointmentRow}>
                  <View style={styles.appointmentInfo}>
                    <Text style={styles.patientName}>{appointment.patient_name}</Text>
                    <Text style={styles.doctorName}>BS. {appointment.doctor_name}</Text>
                  </View>
                  <View>
                    <Text style={styles.dateText}>{appointment.appointment_date}</Text>
                    <Text style={styles.timeText}>{appointment.appointment_time}</Text>
                  </View>
                </View>
                <View style={styles.statusRow}>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          appointment.status === 'confirmed'
                            ? '#27AE60'
                            : appointment.status === 'pending'
                            ? '#F39C12'
                            : '#E74C3C',
                      },
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {appointment.status === 'confirmed'
                        ? 'Đã xác nhận'
                        : appointment.status === 'pending'
                        ? 'Chờ xác nhận'
                        : 'Đã hủy'}
                    </Text>
                  </View>
                  <Text style={styles.amountText}>
                    {appointment.amount.toLocaleString()} VNĐ
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
    backgroundColor: '#FFFFFF',
  },
  greeting: {
    fontSize: 16,
    color: '#7F8C8D',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    marginTop: 4,
    textAlign: 'center',
  },
  revenueCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  revenueLabel: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  revenueAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#27AE60',
    marginTop: 4,
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#7F8C8D',
    marginTop: 16,
  },
  appointmentCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  appointmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  appointmentInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  doctorName: {
    fontSize: 14,
    color: '#7F8C8D',
    marginTop: 4,
  },
  dateText: {
    fontSize: 14,
    color: '#2C3E50',
    textAlign: 'right',
  },
  timeText: {
    fontSize: 14,
    color: '#7F8C8D',
    marginTop: 4,
    textAlign: 'right',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  amountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#27AE60',
  },
});

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { Picker } from '@react-native-picker/picker';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8001';

interface Doctor {
  id: string;
  full_name: string;
  specialization: string;
  phone: string;
}

interface Specialization {
  id: string;
  name: string;
}

export default function BookAppointmentScreen() {
  const router = useRouter();
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedSpecialization, setSelectedSpecialization] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSpecializations();
    loadDoctors();
  }, []);

  useEffect(() => {
    if (selectedSpecialization) {
      loadDoctors(selectedSpecialization);
    }
  }, [selectedSpecialization]);

  const loadSpecializations = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/specializations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSpecializations(response.data);
    } catch (error) {
      console.error('Error loading specializations:', error);
    }
  };

  const loadDoctors = async (specialization?: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const url = specialization
        ? `${API_URL}/api/doctors?specialization=${specialization}`
        : `${API_URL}/api/doctors`;

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDoctors(response.data);
    } catch (error) {
      console.error('Error loading doctors:', error);
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedDoctor || !appointmentDate || !appointmentTime) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/api/appointments`,
        {
          doctor_id: selectedDoctor,
          appointment_date: appointmentDate,
          appointment_time: appointmentTime,
          notes,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      Alert.alert('Thành công', 'Đặt lịch khám thành công!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      Alert.alert(
        'Đặt lịch thất bại',
        error.response?.data?.detail || 'Có lỗi xảy ra, vui lòng thử lại'
      );
    } finally {
      setLoading(false);
    }
  };

  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '13:30', '14:00', '14:30', '15:00',
    '15:30', '16:00', '16:30', '17:00'
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#2C3E50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đặt lịch khám</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Specialization */}
        <View style={styles.section}>
          <Text style={styles.label}>Chuyên khoa</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedSpecialization}
              onValueChange={(value) => setSelectedSpecialization(value)}
              style={styles.picker}
            >
              <Picker.Item label="Tất cả chuyên khoa" value="" />
              {specializations.map((spec) => (
                <Picker.Item key={spec.id} label={spec.name} value={spec.name} />
              ))}
            </Picker>
          </View>
        </View>

        {/* Doctor */}
        <View style={styles.section}>
          <Text style={styles.label}>Bác sĩ *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedDoctor}
              onValueChange={(value) => setSelectedDoctor(value)}
              style={styles.picker}
            >
              <Picker.Item label="Chọn bác sĩ" value="" />
              {doctors.map((doctor) => (
                <Picker.Item
                  key={doctor.id}
                  label={`${doctor.full_name} - ${doctor.specialization}`}
                  value={doctor.id}
                />
              ))}
            </Picker>
          </View>
        </View>

        {/* Date */}
        <View style={styles.section}>
          <Text style={styles.label}>Ngày khám *</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="calendar-outline" size={20} color="#7F8C8D" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="DD/MM/YYYY"
              value={appointmentDate}
              onChangeText={setAppointmentDate}
              placeholderTextColor="#95A5A6"
            />
          </View>
        </View>

        {/* Time */}
        <View style={styles.section}>
          <Text style={styles.label}>Giờ khám *</Text>
          <View style={styles.timeSlotGrid}>
            {timeSlots.map((time) => (
              <TouchableOpacity
                key={time}
                style={[
                  styles.timeSlot,
                  appointmentTime === time && styles.timeSlotSelected,
                ]}
                onPress={() => setAppointmentTime(time)}
              >
                <Text
                  style={[
                    styles.timeSlotText,
                    appointmentTime === time && styles.timeSlotTextSelected,
                  ]}
                >
                  {time}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.label}>Ghi chú</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Nhập triệu chứng hoặc ghi chú..."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              placeholderTextColor="#95A5A6"
            />
          </View>
        </View>

        {/* Book Button */}
        <TouchableOpacity
          style={styles.bookButton}
          onPress={handleBookAppointment}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.bookButtonText}>Đặt lịch</Text>
          )}
        </TouchableOpacity>
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
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8EAED',
  },
  picker: {
    height: 50,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E8EAED',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#2C3E50',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  timeSlotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  timeSlot: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E8EAED',
    minWidth: 80,
    alignItems: 'center',
  },
  timeSlotSelected: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  timeSlotText: {
    fontSize: 14,
    color: '#2C3E50',
    fontWeight: '500',
  },
  timeSlotTextSelected: {
    color: '#FFFFFF',
  },
  bookButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 40,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

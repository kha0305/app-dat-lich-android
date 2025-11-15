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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import DatePickerButton from '../../components/DatePickerButton';
import CustomDropdown, { DropdownOption } from '../../components/CustomDropdown';
import { Colors } from '../../constants/Colors';

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
  const [appointmentDate, setAppointmentDate] = useState<Date | null>(null);
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
    } else {
      loadDoctors();
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
      
      // Format date to DD/MM/YYYY
      const day = appointmentDate.getDate().toString().padStart(2, '0');
      const month = (appointmentDate.getMonth() + 1).toString().padStart(2, '0');
      const year = appointmentDate.getFullYear();
      const formattedDate = `${day}/${month}/${year}`;

      const response = await axios.post(
        `${API_URL}/api/appointments`,
        {
          doctor_id: selectedDoctor,
          appointment_date: formattedDate,
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

  // Convert data to dropdown options
  const specializationOptions: DropdownOption[] = [
    { label: 'Tất cả chuyên khoa', value: '' },
    ...specializations.map(spec => ({ label: spec.name, value: spec.name }))
  ];

  const doctorOptions: DropdownOption[] = [
    { label: 'Chọn bác sĩ', value: '' },
    ...doctors.map(doc => ({ 
      label: `${doc.full_name} - ${doc.specialization}`, 
      value: doc.id 
    }))
  ];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đặt lịch khám</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Specialization Dropdown */}
        <CustomDropdown
          label="Chuyên khoa"
          placeholder="Chọn chuyên khoa"
          value={selectedSpecialization}
          options={specializationOptions}
          onChange={setSelectedSpecialization}
        />

        {/* Doctor Dropdown */}
        <CustomDropdown
          label="Bác sĩ"
          placeholder="Chọn bác sĩ"
          value={selectedDoctor}
          options={doctorOptions}
          onChange={setSelectedDoctor}
          required
        />

        {/* Date Picker */}
        <DatePickerButton
          label="Ngày khám"
          value={appointmentDate}
          onChange={setAppointmentDate}
          placeholder="Chọn ngày khám"
        />

        {/* Time Slots */}
        <View style={styles.section}>
          <Text style={styles.label}>
            Giờ khám <Text style={styles.required}>*</Text>
          </Text>
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
          <View style={styles.textAreaContainer}>
            <TextInput
              style={styles.textArea}
              placeholder="Nhập triệu chứng hoặc ghi chú..."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              placeholderTextColor={Colors.textTertiary}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Book Button */}
        <TouchableOpacity
          style={[styles.bookButton, loading && styles.bookButtonDisabled]}
          onPress={handleBookAppointment}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={Colors.textLight} />
          ) : (
            <>
              <Ionicons name="calendar" size={20} color={Colors.textLight} style={styles.buttonIcon} />
              <Text style={styles.bookButtonText}>Đặt lịch khám</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: Colors.surface,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
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
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  required: {
    color: Colors.error,
  },
  textAreaContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textArea: {
    fontSize: 16,
    color: Colors.textPrimary,
    minHeight: 100,
  },
  timeSlotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  timeSlot: {
    backgroundColor: Colors.surface,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    minWidth: 80,
    alignItems: 'center',
  },
  timeSlotSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  timeSlotText: {
    fontSize: 15,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  timeSlotTextSelected: {
    color: Colors.textLight,
  },
  bookButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 40,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  bookButtonDisabled: {
    opacity: 0.6,
  },
  buttonIcon: {
    marginRight: 8,
  },
  bookButtonText: {
    color: Colors.textLight,
    fontSize: 17,
    fontWeight: '700',
  },
});

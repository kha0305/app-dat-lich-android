import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { Picker } from '@react-native-picker/picker';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8001';

export default function RegisterScreen() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    phone: '',
    role: 'patient',
    date_of_birth: '',
    address: '',
    id_card: '',
    specialization: '',
    medical_history: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async () => {
    // Validation
    if (!formData.email || !formData.password || !formData.full_name || !formData.phone) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp');
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert('Lỗi', 'Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setLoading(true);
    try {
      const registerData = { ...formData };
      delete registerData.confirmPassword;

      const response = await axios.post(`${API_URL}/api/auth/register`, registerData);

      if (response.data.token) {
        await AsyncStorage.setItem('token', response.data.token);
        await AsyncStorage.setItem('user', JSON.stringify(response.data.user));

        Alert.alert('Thành công', 'Đăng ký tài khoản thành công!', [
          {
            text: 'OK',
            onPress: () => {
              const role = response.data.user.role;
              if (role === 'patient') {
                router.replace('/patient/dashboard');
              } else if (role === 'doctor') {
                router.replace('/doctor/dashboard');
              } else if (role === 'admin') {
                router.replace('/admin/dashboard');
              }
            },
          },
        ]);
      }
    } catch (error: any) {
      Alert.alert(
        'Đăng ký thất bại',
        error.response?.data?.detail || 'Có lỗi xảy ra, vui lòng thử lại'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#2C3E50" />
          </TouchableOpacity>
          <Ionicons name="person-add" size={60} color="#4A90E2" />
          <Text style={styles.title}>Đăng ký</Text>
          <Text style={styles.subtitle}>Tạo tài khoản mới</Text>
        </View>

        <View style={styles.form}>
          {/* Role Selection */}
          <Text style={styles.label}>Loại tài khoản *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.role}
              onValueChange={(value) => setFormData({ ...formData, role: value })}
              style={styles.picker}
            >
              <Picker.Item label="Bệnh nhân" value="patient" />
              <Picker.Item label="Bác sĩ" value="doctor" />
            </Picker>
          </View>

          {/* Email */}
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#7F8C8D" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email *"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#95A5A6"
            />
          </View>

          {/* Full Name */}
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color="#7F8C8D" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Họ và tên *"
              value={formData.full_name}
              onChangeText={(text) => setFormData({ ...formData, full_name: text })}
              placeholderTextColor="#95A5A6"
            />
          </View>

          {/* Phone */}
          <View style={styles.inputContainer}>
            <Ionicons name="call-outline" size={20} color="#7F8C8D" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Số điện thoại *"
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              keyboardType="phone-pad"
              placeholderTextColor="#95A5A6"
            />
          </View>

          {/* Date of Birth */}
          <View style={styles.inputContainer}>
            <Ionicons name="calendar-outline" size={20} color="#7F8C8D" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Ngày sinh (DD/MM/YYYY)"
              value={formData.date_of_birth}
              onChangeText={(text) => setFormData({ ...formData, date_of_birth: text })}
              placeholderTextColor="#95A5A6"
            />
          </View>

          {/* Address */}
          <View style={styles.inputContainer}>
            <Ionicons name="location-outline" size={20} color="#7F8C8D" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Địa chỉ"
              value={formData.address}
              onChangeText={(text) => setFormData({ ...formData, address: text })}
              placeholderTextColor="#95A5A6"
            />
          </View>

          {/* ID Card */}
          <View style={styles.inputContainer}>
            <Ionicons name="card-outline" size={20} color="#7F8C8D" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="CMND/CCCD"
              value={formData.id_card}
              onChangeText={(text) => setFormData({ ...formData, id_card: text })}
              keyboardType="number-pad"
              placeholderTextColor="#95A5A6"
            />
          </View>

          {/* Conditional Fields */}
          {formData.role === 'doctor' && (
            <View style={styles.inputContainer}>
              <Ionicons name="medkit-outline" size={20} color="#7F8C8D" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Chuyên khoa *"
                value={formData.specialization}
                onChangeText={(text) => setFormData({ ...formData, specialization: text })}
                placeholderTextColor="#95A5A6"
              />
            </View>
          )}

          {formData.role === 'patient' && (
            <View style={styles.inputContainer}>
              <Ionicons name="document-text-outline" size={20} color="#7F8C8D" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Tiền sử bệnh"
                value={formData.medical_history}
                onChangeText={(text) => setFormData({ ...formData, medical_history: text })}
                multiline
                placeholderTextColor="#95A5A6"
              />
            </View>
          )}

          {/* Password */}
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#7F8C8D" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Mật khẩu *"
              value={formData.password}
              onChangeText={(text) => setFormData({ ...formData, password: text })}
              secureTextEntry={!showPassword}
              placeholderTextColor="#95A5A6"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                size={20}
                color="#7F8C8D"
              />
            </TouchableOpacity>
          </View>

          {/* Confirm Password */}
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#7F8C8D" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Xác nhận mật khẩu *"
              value={formData.confirmPassword}
              onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
              secureTextEntry={!showPassword}
              placeholderTextColor="#95A5A6"
            />
          </View>

          <TouchableOpacity
            style={styles.registerButton}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.registerButtonText}>Đăng ký</Text>
            )}
          </TouchableOpacity>

          <View style={styles.loginPrompt}>
            <Text style={styles.loginText}>Đã có tài khoản? </Text>
            <TouchableOpacity onPress={() => router.push('/login')}>
              <Text style={styles.loginLink}>Đăng nhập</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 14,
    color: '#7F8C8D',
    marginTop: 8,
  },
  form: {
    marginTop: 20,
  },
  label: {
    fontSize: 14,
    color: '#2C3E50',
    fontWeight: '600',
    marginBottom: 8,
  },
  pickerContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E8EAED',
  },
  picker: {
    height: 50,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
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
  registerButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loginPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  loginText: {
    color: '#7F8C8D',
    fontSize: 14,
  },
  loginLink: {
    color: '#4A90E2',
    fontSize: 14,
    fontWeight: '600',
  },
});

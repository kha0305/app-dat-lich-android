// Medical Theme Colors - Modern Teal Medical Design
export const Colors = {
  // Primary Colors - Medical Teal
  primary: '#00BFA5',
  primaryDark: '#00897B',
  primaryLight: '#5DF2D6',
  
  // Background Colors
  background: '#F5F9F8',
  surface: '#FFFFFF',
  surfaceLight: '#E0F2F1',
  
  // Text Colors
  textPrimary: '#263238',
  textSecondary: '#546E7A',
  textTertiary: '#78909C',
  textLight: '#FFFFFF',
  
  // Status Colors
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',
  
  // Appointment Status
  pending: '#FF9800',
  confirmed: '#4CAF50',
  cancelled: '#F44336',
  completed: '#2196F3',
  
  // Border & Divider
  border: '#CFD8DC',
  borderLight: '#ECEFF1',
  divider: '#E0E0E0',
  
  // Shadow (for styles)
  shadow: 'rgba(0, 0, 0, 0.1)',
  
  // Gradient Colors
  gradientStart: '#00BFA5',
  gradientEnd: '#00897B',
  
  // Chat Colors
  myMessageBg: '#00BFA5',
  otherMessageBg: '#ECEFF1',
  
  // Input Colors
  inputBackground: '#F5F5F5',
  inputBorder: '#E0E0E0',
  inputFocus: '#00BFA5',
};

// Status color helper
export const getStatusColor = (status: string): string => {
  const statusMap: { [key: string]: string } = {
    pending: Colors.pending,
    confirmed: Colors.confirmed,
    cancelled: Colors.cancelled,
    completed: Colors.completed,
  };
  return statusMap[status] || Colors.textSecondary;
};

// Status text helper
export const getStatusText = (status: string): string => {
  const statusMap: { [key: string]: string } = {
    pending: 'Chờ xác nhận',
    confirmed: 'Đã xác nhận',
    cancelled: 'Đã hủy',
    completed: 'Hoàn thành',
  };
  return statusMap[status] || status;
};

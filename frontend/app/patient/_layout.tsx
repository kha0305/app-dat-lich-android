import { Stack } from 'expo-router';

export default function PatientLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="book-appointment" />
      <Stack.Screen name="appointments" />
      <Stack.Screen name="chat/[id]" />
    </Stack>
  );
}

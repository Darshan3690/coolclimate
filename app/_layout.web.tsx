import '../styles/output.css';
import { Stack } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';
import { UserDataProvider } from '../context/UserDataContext';

export default function RootLayoutWeb() {
  return (
    <AuthProvider>
      <UserDataProvider>
        <Stack screenOptions={{ headerShown: false }} initialRouteName="login">
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="signup" />
          <Stack.Screen name="landing" />
          <Stack.Screen name="home" />
          <Stack.Screen name="dashboard" />
        </Stack>
      </UserDataProvider>
    </AuthProvider>
  );
}

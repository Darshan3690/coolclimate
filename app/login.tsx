import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ImageBackground,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      Alert.alert('Success', 'Logged in successfully!');
      setTimeout(() => {
        router.replace({ pathname: '/landing' } as unknown as any);
      }, 200);
    } catch (error: any) {
      Alert.alert('Login Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require('../assets/images/co2-forest-background.jpg')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <View style={styles.overlay}>
          <View style={styles.card}>
            <Text style={styles.title}>
              Welcome Back! 👋
            </Text>

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor="rgba(75, 85, 99, 0.6)"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor="rgba(75, 85, 99, 0.6)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              style={styles.button}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Logging in...' : 'Login'}
              </Text>
            </TouchableOpacity>

            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/signup' as unknown as any)}>
                <Text style={styles.signupLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
  },
  safe: { 
    flex: 1, 
    backgroundColor: 'transparent',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)', // Slightly darker overlay for better contrast
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  container: { 
    flex: 1, 
    justifyContent: 'center', 
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)', // Much more opaque for better readability
    backdropFilter: 'blur(20px)', // Increased blur effect
    borderRadius: 24,
    padding: 32, // Increased padding
    minHeight: 450, // Increased card height
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.6)', // More visible border
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 32, // Proper spacing after title
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold', // Bold labels
    color: '#111827',
    marginBottom: 8, // Proper spacing before input
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)', // Light background for better visibility
    borderRadius: 12,
    padding: 16, // Increased padding for inputs
    marginBottom: 20, // Proper spacing between input fields
    color: '#1f2937', // Dark text for better contrast on light background
    borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 0.3)', // Green themed border
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  button: { 
    backgroundColor: 'rgba(16, 185, 129, 0.9)', // More opaque button for better visibility
    borderRadius: 12,
    paddingVertical: 16, // Increased button padding
    marginBottom: 24, // Proper spacing after button
    borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 1)', // Solid green border
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    fontSize: 16,
    fontWeight: 'bold', // Bold "Don't have an account?"
    color: '#111827',
  },
  signupLink: {
    fontSize: 16,
    fontWeight: 'bold', // Bold "Sign Up"
    color: '#10b981',
  },
});
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

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const router = useRouter();

  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await signup(email, password);
      Alert.alert('Success', 'Account created successfully!');
      // Small delay so the Alert can be seen on web, then navigate
      console.debug('Signup successful, redirecting to landing page...');
      setTimeout(() => {
        // Use object-form navigation for reliability
        // Cast to any to satisfy TypeScript route typing
        router.replace({ pathname: '/landing' } as unknown as any);
      }, 250);
    } catch (error: any) {
      Alert.alert('Sign Up Failed', error.message);
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
                Create Account 
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

              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Confirm your password"
                placeholderTextColor="rgba(75, 85, 99, 0.6)"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />

              <TouchableOpacity
                onPress={handleSignUp}
                disabled={loading}
                style={styles.button}
              >
                <Text style={styles.buttonText}>
                  {loading ? 'Creating Account...' : 'Sign Up'}
                </Text>
              </TouchableOpacity>

              <View style={styles.signupContainer}>
                <Text style={styles.signupText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => router.push('/login' as unknown as any)}>
                  <Text style={styles.signupLink}>Login</Text>
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
    minHeight: 550, // Increased card height for signup (more fields)
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
    fontWeight: 'bold', // Bold "Already have an account?"
    color: '#111827',
  },
  signupLink: {
    fontSize: 16,
    fontWeight: 'bold', // Bold "Login"
    color: '#10b981',
  },
});
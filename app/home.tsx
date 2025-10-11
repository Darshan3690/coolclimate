import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
      try {
      await logout();
      router.replace('/login' as unknown as any);
    } catch (error) {
      Alert.alert('Error', 'Failed to logout');
    }
  };

  return (
    <View className="flex-1 bg-green-500 justify-center px-6">
      <View className="bg-white rounded-3xl p-8">
        <Text className="text-3xl font-bold text-gray-900 text-center mb-4">
          Welcome! 🎉
        </Text>
        <Text className="text-gray-600 text-center mb-8">
          You are logged in as:{'\n'}
          <Text className="font-bold text-gray-900">{user?.email}</Text>
        </Text>

        <TouchableOpacity
          className="bg-red-500 rounded-xl py-4"
          onPress={handleLogout}
        >
          <Text className="text-white font-bold text-center text-lg">
            Logout
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
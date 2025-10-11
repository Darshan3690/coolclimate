import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';

export default function Index() {
  const router = useRouter();
  const { user } = useAuth();

  React.useEffect(() => {
    if (user) {
      router.replace('/home' as unknown as any);
    }
  }, [user]);

  return (
    <View className="flex-1 bg-blue-500 justify-center px-6">
      <View className="bg-white rounded-3xl p-8">
        <Text className="text-4xl font-bold text-gray-900 text-center mb-4">
          Welcome! 👋
        </Text>
        <Text className="text-gray-600 text-center mb-8">
          Get started with your amazing app
        </Text>

        <TouchableOpacity
          className="bg-blue-500 rounded-xl py-4 mb-4"
          onPress={() => router.push('/login' as unknown as any)}
        >
          <Text className="text-white font-bold text-center text-lg">
            Login
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-purple-500 rounded-xl py-4"
          onPress={() => router.push('/signup' as unknown as any)}
        >
          <Text className="text-white font-bold text-center text-lg">
            Sign Up
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
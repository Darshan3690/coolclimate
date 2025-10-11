// app/landing.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Link } from 'expo-router';
import Svg, { Circle } from 'react-native-svg';
import { useAuth } from '../context/AuthContext';

export default function LandingScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  // --- State for AI Suggestion ---
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);

  // --- State for Navigation Modal ---
  const [showNavigationModal, setShowNavigationModal] = useState(false);

  const userData = {
    coins: 160,
    carbonSaved: 153.97,
    target: 240,
    streak: 6,
    userName: user?.email?.substring(0, 2).toUpperCase() || 'DR',
  };

  // --- AI Suggestion Handler ---
  const getAIActionSuggestion = async () => {
    setIsLoadingSuggestion(true);
    setSuggestion(null);

    const fallbackSuggestions = [
      "Take a 15-minute walk instead of driving for short errands today",
      "Switch off lights and electronics when not in use",
      "Try a plant-based meal for lunch to reduce carbon footprint",
      "Use a reusable water bottle instead of buying plastic ones",
      "Take the stairs instead of the elevator to save energy",
      "Carpool or use public transport for your next trip",
      "Plant a small herb garden on your balcony or windowsill",
    ];

    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const randomSuggestion =
        fallbackSuggestions[Math.floor(Math.random() * fallbackSuggestions.length)];
      setSuggestion(randomSuggestion);
    } catch (error) {
      console.error("Error generating suggestion:", error);
      setSuggestion(fallbackSuggestions[0]);
    } finally {
      setIsLoadingSuggestion(false);
    }
  };

  const progressPercent = (userData.carbonSaved / userData.target) * 100;
  const treesEquivalent = Math.floor(userData.carbonSaved / 2);
  const circumference = 2 * Math.PI * 80;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Ionicons name="globe-outline" size={32} color="#10b981" />
            <Text style={styles.logoText}>Cool Climate</Text>
          </View>

          <TouchableOpacity style={styles.avatar} onPress={logout}>
            <Text style={styles.avatarText}>{userData.userName}</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Hero Card */}
          <LinearGradient colors={['#047857', '#374151']} style={styles.heroCard}>
            <View style={styles.heroContent}>
              <View style={styles.heroTitle}>
                <Text style={styles.heroText}>Let&apos;s Start With</Text>
                <Link href="/action" asChild>
                  <TouchableOpacity>
                    <View style={styles.actionBadge}>
                      <Text style={styles.actionBadgeText}>Action 🏆</Text>
                    </View>
                  </TouchableOpacity>
                </Link>
              </View>

              {/* AI Suggestion */}
              <View style={styles.aiSuggestionContainer}>
                {isLoadingSuggestion ? (
                  <ActivityIndicator size="large" color="#fff" />
                ) : suggestion ? (
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                ) : (
                  <TouchableOpacity
                    style={styles.aiButton}
                    onPress={getAIActionSuggestion}
                    disabled={isLoadingSuggestion}
                  >
                    <Text style={styles.aiButtonText}>✨ Suggest an Action</Text>
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                style={[styles.taskButton, { marginTop: 12 }]}
                onPress={() => router.push('/calculator')}
              >
                <Text style={styles.taskButtonText}>Calculate Carbon Footprint</Text>
                <Ionicons name="calculator" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* Progress Card */}
          <LinearGradient colors={['#374151', '#1f2937']} style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <View style={styles.targetLabel}>
                <Ionicons name="flag" size={24} color="#10b981" />
                <Text style={styles.targetText}>Target</Text>
              </View>

              <View style={styles.dateBadges}>
                <View style={styles.monthBadge}>
                  <Text style={styles.monthBadgeText}>M</Text>
                </View>
                <View style={styles.yearBadge}>
                  <Text style={styles.yearBadgeText}>2025</Text>
                </View>
              </View>
            </View>

            <Text style={styles.targetAmount}>Save {userData.target} kg CO₂eq</Text>

            {/* Progress Circle */}
            <View style={styles.progressCircle}>
              <Svg width={200} height={200}>
                <Circle cx="100" cy="100" r="80" stroke="#1f2937" strokeWidth="12" fill="none" />
                <Circle
                  cx="100"
                  cy="100"
                  r="80"
                  stroke="#10b981"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  rotation="-90"
                  origin="100, 100"
                />
              </Svg>

              <View style={styles.progressText}>
                <Text style={styles.progressLabel}>You Saved</Text>
                <Text style={styles.progressValue}>{userData.carbonSaved}</Text>
                <Text style={styles.progressUnit}>kg CO₂eq</Text>
              </View>
            </View>

            <Text style={styles.treesText}>
              🌳 Your savings equal what{' '}
              <Text style={styles.treesHighlight}>{treesEquivalent} trees</Text> fix in a month!
            </Text>
          </LinearGradient>
        </View>
      </ScrollView>

      {/* --- Bottom Navigation --- */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <View style={styles.navIconActive}>
            <Ionicons name="home" size={24} color="#10b981" />
          </View>
          <Text style={styles.navTextActive}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navCenter}
          onPress={() => setShowNavigationModal(true)}
        >
          <Ionicons name="globe" size={48} color="#10b981" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push('/dashboard')}
        >
          <View style={styles.navIconActive}>
            <Ionicons name="stats-chart" size={24} color="#10b981" />
          </View>
          <Text style={styles.navTextActive}>Dashboard</Text>
        </TouchableOpacity>
      </View>

      {/* --- Modal for Navigation --- */}
      <Modal
        visible={showNavigationModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowNavigationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choose an Option</Text>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setShowNavigationModal(false);
                router.push('/calculator');
              }}
            >
              <Ionicons name="calculator" size={24} color="#10b981" />
              <Text style={styles.modalButtonText}>Calculator</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setShowNavigationModal(false);
                router.push('/action');
              }}
            >
              <Ionicons name="flash" size={24} color="#10b981" />
              <Text style={styles.modalButtonText}>Action</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowNavigationModal(false)}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
  },
  logoContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#7c3aed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  content: { padding: 16, paddingBottom: 100 },
  heroCard: {
    minHeight: 240,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 24,
    justifyContent: 'center',
    padding: 24,
  },
  heroContent: { gap: 16 },
  heroTitle: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  heroText: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  actionBadge: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
  },
  actionBadgeText: { color: '#111827', fontWeight: 'bold', fontSize: 14 },
  aiSuggestionContainer: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 16,
    padding: 16,
    minHeight: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  aiButtonText: { color: '#047857', fontWeight: 'bold', fontSize: 16 },
  suggestionText: { color: '#fff', fontSize: 16, textAlign: 'center', lineHeight: 22 },
  taskButton: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  taskButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  progressCard: { borderRadius: 24, padding: 24, marginBottom: 24, gap: 16 },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  targetLabel: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  targetText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  dateBadges: { flexDirection: 'row', gap: 8 },
  monthBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  monthBadgeText: { color: '#111827', fontWeight: 'bold', fontSize: 12 },
  yearBadge: {
    backgroundColor: '#111827',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  yearBadgeText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  targetAmount: { color: '#9ca3af', fontSize: 14, textAlign: 'center' },
  progressCircle: { alignItems: 'center', justifyContent: 'center', position: 'relative' },
  progressText: { position: 'absolute', alignItems: 'center' },
  progressLabel: { color: '#9ca3af', fontSize: 12 },
  progressValue: { color: '#fff', fontSize: 48, fontWeight: 'bold' },
  progressUnit: { color: '#9ca3af', fontSize: 12 },
  treesText: { color: '#d1d5db', textAlign: 'center', fontSize: 14 },
  treesHighlight: { color: '#10b981', fontWeight: 'bold' },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#111827',
    borderTopWidth: 1,
    borderTopColor: '#374151',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
  },
  navItem: { alignItems: 'center', gap: 4 },
  navIconActive: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navTextActive: { color: '#10b981', fontSize: 10, fontWeight: '600' },
  navCenter: { position: 'relative' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1f2937',
    borderRadius: 20,
    padding: 24,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 24 },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    width: '100%',
    gap: 12,
  },
  modalButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  modalCloseButton: {
    backgroundColor: '#ef4444',
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
    width: '100%',
    alignItems: 'center',
  },
  modalCloseText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});

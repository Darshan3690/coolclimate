import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { getUserStats, calculateLevelProgress } from '../services/dashboardService';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import type { Auth } from 'firebase/auth';
const firebaseAuth = auth as unknown as Auth;

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStats();
  }, [user]);

  const loadStats = async () => {
    if (!user) return;
    
    try {
      const userStats = await getUserStats(user.uid);
      setStats(userStats);
    } catch (error) {
      console.error('Error loading stats:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    try {
  await signOut(firebaseAuth as any);
      router.replace('/login' as any);
    } catch (error) {
      Alert.alert('Error', 'Failed to logout');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const levelProgress = stats ? calculateLevelProgress(stats.carbonSaved || 0) : null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#10b981', '#059669']} style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Welcome back!</Text>
            <Text style={styles.userName}>{user?.email?.split('@')[0] || 'User'}</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Level Progress */}
        {levelProgress && (
          <View style={styles.levelCard}>
            <View style={styles.levelHeader}>
              <View style={styles.levelBadge}>
                <Ionicons name="trophy" size={24} color="#fbbf24" />
                <Text style={styles.levelNumber}>Level {levelProgress.currentLevel}</Text>
              </View>
              <Text style={styles.levelCoins}>
                <Ionicons name="diamond" size={16} /> {stats?.coins || 0} coins
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${levelProgress.progressPercentage}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {levelProgress.carbonToNextLevel.toFixed(1)} kg to level {levelProgress.currentLevel + 1}
            </Text>
          </View>
        )}
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />}
      >
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: '#10b981' }]}>
            <Ionicons name="leaf" size={32} color="#fff" />
            <Text style={styles.statValue}>{((stats?.carbonSaved ?? 0)).toFixed(1)}</Text>
            <Text style={styles.statLabel}>kg CO₂ Saved</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#3b82f6' }]}>
            <Ionicons name="checkmark-circle" size={32} color="#fff" />
            <Text style={styles.statValue}>{stats?.actionsCompleted ?? 0}</Text>
            <Text style={styles.statLabel}>Actions</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#f59e0b' }]}>
            <Ionicons name="flame" size={32} color="#fff" />
            <Text style={styles.statValue}>{stats?.streakDays ?? 0}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#8b5cf6' }]}>
            <Ionicons name="star" size={32} color="#fff" />
            <Text style={styles.statValue}>{stats?.achievements?.length ?? 0}</Text>
            <Text style={styles.statLabel}>Achievements</Text>
          </View>
        </View>

        {/* Weekly Progress */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Weekly Impact</Text>
          {stats?.weeklyProgress && (
            <View style={styles.progressList}>
              {Object.entries(stats.weeklyProgress).map(([key, value]: [string, any]) => {
                const icons = {
                  transport: 'car',
                  energy: 'bulb',
                  food: 'restaurant',
                  waste: 'trash',
                };
                const colors = {
                  transport: '#3b82f6',
                  energy: '#f59e0b',
                  food: '#ef4444',
                  waste: '#10b981',
                };
                
                return (
                  <View key={key} style={styles.progressItem}>
                    <View style={styles.progressLeft}>
                      <View style={[styles.progressIcon, { backgroundColor: colors[key as keyof typeof colors] }]}>
                        <Ionicons name={icons[key as keyof typeof icons] as any} size={20} color="#fff" />
                      </View>
                      <Text style={styles.progressLabel}>{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
                    </View>
                    <Text style={styles.progressValue}>{(value ?? 0).toFixed(1)} kg</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/calculator' as any)}
            >
              <LinearGradient colors={['#10b981', '#059669']} style={styles.actionGradient}>
                <Ionicons name="calculator" size={32} color="#fff" />
                <Text style={styles.actionText}>Calculate Footprint</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/action' as any)}
            >
              <LinearGradient colors={['#3b82f6', '#2563eb']} style={styles.actionGradient}>
                <Ionicons name="add-circle" size={32} color="#fff" />
                <Text style={styles.actionText}>Log Action</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Environmental Impact */}
        <View style={styles.impactCard}>
          <Ionicons name="earth" size={48} color="#10b981" />
          <Text style={styles.impactTitle}>Your Environmental Impact</Text>
          <Text style={styles.impactDescription}>
            You've saved the equivalent of:
          </Text>
          <View style={styles.impactStats}>
            <View style={styles.impactItem}>
              <Text style={styles.impactValue}>{((stats?.carbonSaved || 0) / 0.4).toFixed(0)}</Text>
              <Text style={styles.impactLabel}>Trees planted</Text>
            </View>
            <View style={styles.impactItem}>
              <Text style={styles.impactValue}>{((stats?.carbonSaved || 0) / 2.3).toFixed(0)}</Text>
              <Text style={styles.impactLabel}>Miles not driven</Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111827',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  greeting: {
    color: '#fff',
    fontSize: 16,
    opacity: 0.9,
  },
  userName: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 4,
  },
  logoutButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
  },
  levelCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 16,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  levelNumber: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  levelCoins: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
  },
  progressText: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.9,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.9,
    marginTop: 4,
  },
  sectionCard: {
    backgroundColor: '#1f2937',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  progressList: {
    gap: 12,
  },
  progressItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressLabel: {
    color: '#d1d5db',
    fontSize: 16,
  },
  progressValue: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  actionGradient: {
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  actionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  impactCard: {
    backgroundColor: '#1f2937',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  impactTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
  },
  impactDescription: {
    color: '#9ca3af',
    fontSize: 14,
    marginBottom: 16,
  },
  impactStats: {
    flexDirection: 'row',
    gap: 32,
  },
  impactItem: {
    alignItems: 'center',
  },
  impactValue: {
    color: '#10b981',
    fontSize: 32,
    fontWeight: 'bold',
  },
  impactLabel: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 4,
  },
  bottomPadding: {
    height: 32,
  },
});
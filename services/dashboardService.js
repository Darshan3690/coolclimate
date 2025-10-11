import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useUserData } from '../context/UserDataContext';
import { useAuth } from '../context/AuthContext';

interface UserData {
  totalCarbonSaved: number;
  weeklyGoal: number;
  monthlyGoal: number;
  currentStreak: number;
  longestStreak: number;
  totalActions: number;
  coins: number;
  level: number;
  weeklyData: Array<{
    day: string;
    carbon: number;
    actions: number;
  }>;
  actionTypes: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  achievements: Array<{
    title: string;
    unlocked: boolean;
    date?: string;
    target?: number;
  }>;
}

interface MetricCardProps {
  title: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  isNewUser?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, color, isNewUser }) => (
  <LinearGradient
    colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)']}
    style={styles.card}
  >
    <View style={styles.cardContent}>
      <Ionicons name={icon} size={24} color={color} />
      <View style={styles.cardText}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardValue}>
          {isNewUser ? "Let's get started!" : value}
        </Text>
      </View>
    </View>
  </LinearGradient>
);

export default function ClimateMonitoringDashboard() {
  const router = useRouter();
  const { userData, loading, refreshData } = useUserData();
  const { user } = useAuth();

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const isNewUser = Boolean(userData && (
    userData.totalCarbonSaved === 0 && 
    userData.totalActions === 0 && 
    userData.currentStreak === 0
  ));

  if (loading || !userData) {
    return (
      <LinearGradient
        colors={['#10b981', '#059669']}
        style={styles.container}
      >
        <View style={styles.loadingContainer}>
          <Ionicons name="leaf" size={50} color="white" />
          <Text style={styles.loadingText}>Loading your climate data...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#10b981', '#059669']}
      style={styles.container}
    >
      <ScrollView
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            {/* --- NEW: Back Button --- */}
            <TouchableOpacity 
              onPress={() => router.back()} 
              style={styles.backButton}
            >
              <Ionicons name="arrow-back-outline" size={28} color="white" />
            </TouchableOpacity>
            
            <Text style={styles.title}>Climate Dashboard</Text>
            <Text style={styles.subtitle}>
              {isNewUser ? 'Welcome to your climate journey!' : 'Track your environmental impact'}
            </Text>
          </View>

          {/* Welcome Section for New Users */}
          {isNewUser && (
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeTitle}>Welcome to Your Climate Journey! 🌱</Text>
              <Text style={styles.welcomeText}>
                Start tracking your environmental impact and make a difference for our planet.
              </Text>
              <View style={styles.quickActions}>
                <TouchableOpacity 
                  style={styles.quickActionButton}
                  onPress={() => router.push('/calculator' as any)}
                >
                  <Ionicons name="calculator" size={20} color="#fff" />
                  <Text style={styles.quickActionText}>Calculate Footprint</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.quickActionButton}
                  onPress={() => router.push('/action' as any)}
                >
                  <Ionicons name="add-circle" size={20} color="#fff" />
                  <Text style={styles.quickActionText}>Log Action</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Metrics Grid */}
          <View style={styles.metricsGrid}>
            <MetricCard
              title="Carbon Saved"
              value={${userData.totalCarbonSaved} kg}
              icon="leaf"
              color="#10b981"
              isNewUser={isNewUser}
            />
            <MetricCard
              title="Current Streak"
              value={${userData.currentStreak} days}
              icon="flame"
              color="#f59e0b"
              isNewUser={isNewUser}
            />
            <MetricCard
              title="Total Actions"
              value={userData.totalActions.toString()}
              icon="checkmark-circle"
              color="#3b82f6"
              isNewUser={isNewUser}
            />
            <MetricCard
              title="Eco Coins"
              value={userData.coins.toString()}
              icon="diamond"
              color="#8b5cf6"
              isNewUser={isNewUser}
            />
          </View>

          {/* Weekly Activity Chart */}
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Weekly Activity</Text>
            {isNewUser ? (
              <View style={styles.emptyState}>
                <Ionicons name="bar-chart-outline" size={48} color="#666" />
                <Text style={styles.emptyStateText}>No activity data yet</Text>
                <Text style={styles.emptyStateSubtext}>
                  Start logging your climate actions to see your progress here!
                </Text>
              </View>
            ) : (
              <View style={styles.chartPlaceholder}>
                <Text style={styles.chartPlaceholderText}>
                  Weekly chart will be displayed here
                </Text>
              </View>
            )}
          </View>

          {/* Action Distribution */}
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Action Distribution</Text>
            {isNewUser ? (
              <View style={styles.emptyState}>
                <Ionicons name="pie-chart-outline" size={48} color="#666" />
                <Text style={styles.emptyStateText}>No actions logged yet</Text>
                <Text style={styles.emptyStateSubtext}>
                  Log different types of climate actions to see the breakdown here!
                </Text>
              </View>
            ) : (
              <View style={styles.actionTypesContainer}>
                {userData.actionTypes && userData.actionTypes.map((action, index) => (
                  <View key={index} style={styles.actionTypeItem}>
                    <View 
                      style={[styles.actionTypeColor, { backgroundColor: action.color }]} 
                    />
                    <Text style={styles.actionTypeText}>{action.name}</Text>
                    <Text style={styles.actionTypeValue}>{action.value}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Achievements */}
          <View style={styles.achievementsContainer}>
            <Text style={styles.sectionTitle}>Achievements</Text>
            {isNewUser ? (
              <View style={styles.emptyState}>
                <Ionicons name="trophy-outline" size={48} color="#F3F4F6" />
                <Text style={[styles.emptyStateText, { color: '#F3F4F6' }]}>No achievements yet</Text>
                <Text style={[styles.emptyStateSubtext, { color: '#F3F4F6' }]}>
                  Complete climate actions to unlock achievements!
                </Text>
                
                {/* Getting Started Guide for New Users */}
                <View style={styles.guideCard}>
                  <Text style={styles.guideTitle}>Getting Started Guide</Text>
                  <Text style={styles.guideText}>
                    1. Calculate your carbon footprint{'\n'}
                    2. Log daily eco-friendly actions{'\n'}
                    3. Set and achieve weekly goals{'\n'}
                    4. Unlock achievements and earn coins
                  </Text>
                  <TouchableOpacity 
                    style={styles.guideButton}
                    onPress={() => router.push('/calculator' as any)}
                  >
                    <Text style={styles.guideButtonText}>Start Now</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {userData.achievements && userData.achievements.map((achievement, index) => (
                  <View key={index} style={styles.achievementCard}>
                    <Ionicons 
                      name={achievement.unlocked ? "trophy" : "trophy-outline"} 
                      size={24} 
                      color={achievement.unlocked ? "#f59e0b" : "#666"} 
                    />
                    <Text style={styles.achievementTitle}>{achievement.title}</Text>
                    <Text style={styles.achievementDate}>
                      {achievement.unlocked ? achievement.date : 'Locked'}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    marginTop: 10,
  },
  header: {
    marginBottom: 30,
    alignItems: 'center', // Keep text centered
    position: 'relative', // Add relative positioning to contain the absolute button
  },
  // --- NEW STYLE ---
  backButton: {
    position: 'absolute',
    left: 0,
    top: 5, // Adjust vertical position as needed
    zIndex: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 5,
  },
  welcomeContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 10,
  },
  welcomeText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 10,
  },
  quickActionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  quickActionText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 30,
  },
  card: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 15,
    padding: 15,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardText: {
    marginLeft: 12,
    flex: 1,
  },
  cardTitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  chartContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  chartPlaceholder: {
    height: 120,
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartPlaceholderText: {
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 10,
    marginBottom: 5,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
  },
  actionTypesContainer: {
    gap: 10,
  },
  actionTypeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  actionTypeColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  actionTypeText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  actionTypeValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  achievementsContainer: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
  },
  achievementCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
    padding: 15,
    marginRight: 10,
    alignItems: 'center',
    width: 120,
  },
  achievementTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginTop: 8,
  },
  achievementDate: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
  },
  guideCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 15,
    marginTop: 15,
    width: '100%',
  },
  guideTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white', // Changed for better visibility
    marginBottom: 10,
    textAlign: 'center',
  },
  guideText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)', // Changed for better visibility
    lineHeight: 20,
    marginBottom: 15,
  },
  guideButton: {
    backgroundColor: '#10b981',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignSelf: 'center',
  },
  guideButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});
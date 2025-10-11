import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getUserDashboardData, fixUndefinedValues, subscribeToUserData, formatActionTypes } from '../services/dashboardService';
import { onSnapshot } from 'firebase/firestore';

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
  lastActionDate?: any;
}

interface UserDataContextType {
  userData: UserData | null;
  loading: boolean;
  refreshData: () => Promise<void>;
}

const UserDataContext = createContext<UserDataContextType | null>(null);

export function UserDataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  // Toggle real-time subscription for debugging. Set to true to receive live updates.
  const DEBUG_REALTIME = true;

  // ✅ FIXED: Single fetchUserData function with detailed logging
  const fetchUserData = async () => {
    if (!user) return;
   
    try {
      setLoading(true);
      console.log('=== STARTING DATA FETCH ===');
      console.log('User UID:', user.uid);
      console.log('User Email:', user.email);
     
      // First, fix any undefined values in the database
      await fixUndefinedValues(user.uid);
      console.log('✓ Fixed undefined values');
     
      const data = await getUserDashboardData(user.uid);
      console.log('=== DATA RECEIVED ===');
      console.log('Full data object:', JSON.stringify(data, null, 2));
      console.log('Total Carbon:', data.totalCarbonSaved);
      console.log('Total Actions:', data.totalActions);
      console.log('Current Streak:', data.currentStreak);
     
      setUserData(data as UserData);
      console.log('✓ State updated successfully');
      console.log('State after update (will be visible on next render)');
    } catch (error: any) {
      console.error('❌ ERROR loading user data:', error);
      console.error('Error details:', error?.message || 'Unknown error');
      console.error('Error stack:', error?.stack);
    } finally {
      setLoading(false);
      console.log('=== DATA FETCH COMPLETE ===');
    }
  };

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    if (user) {
      console.log('useEffect triggered - user exists, fetching data...');

      if (DEBUG_REALTIME && subscribeToUserData) {
        try {
          console.log('Setting up realtime subscription for user:', user.uid);
          unsubscribe = subscribeToUserData(user.uid, (data: any) => {
            console.log('Realtime snapshot received for user:', user.uid);
            console.log('Snapshot data:', JSON.stringify(data, null, 2));
            // Mirror the same shape as getUserDashboardData returns where possible
            const formatted = {
              totalCarbonSaved: data?.stats?.totalCarbonSaved || 0,
              weeklyGoal: data?.stats?.weeklyGoal || 50,
              monthlyGoal: data?.stats?.monthlyGoal || 240,
              currentStreak: data?.stats?.currentStreak || 0,
              longestStreak: data?.stats?.longestStreak || 0,
              totalActions: data?.stats?.totalActions || 0,
              coins: data?.stats?.coins || 0,
              level: data?.stats?.level || 1,
              weeklyData: data?.weeklyData || [],
              actionTypes: formatActionTypes(data?.actionTypes),
              achievements: data?.achievements || [],
              lastActionDate: data?.stats?.lastActionDate,
            } as UserData;

            setUserData(formatted);
            setLoading(false);
          });
        } catch (err) {
          console.error('Realtime subscription error:', err);
          // Fallback to one-time fetch if realtime fails
          fetchUserData();
        }
      } else {
        fetchUserData();
      }
    } else {
      console.log('useEffect triggered - no user, clearing data');
      setUserData(null);
      setLoading(false);
    }

    return () => {
      if (unsubscribe) {
        try { unsubscribe(); } catch (e) { /* ignore */ }
      }
    };
  }, [user]);

  const refreshData = async () => {
    console.log('Manual refresh triggered');
    if (user) {
      await fetchUserData();
    }
  };

  return (
    <UserDataContext.Provider value={{ userData, loading, refreshData }}>
      {children}
    </UserDataContext.Provider>
  );
}

export const useUserData = () => {
  const context = useContext(UserDataContext);
  if (!context) {
    throw new Error('useUserData must be used within UserDataProvider');
  }
  return context;
};
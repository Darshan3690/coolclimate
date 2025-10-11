/**
 * Debug Utilities for Climate Dashboard
 * Use these functions to diagnose data issues
 */

import { doc, getDoc, getDocs, collection } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Debug user data structure
 * Call this to see exactly what's in Firebase
 */
export const debugUserData = async (userId: string) => {
  console.log('\n🔍 ===== DEBUG USER DATA =====');
  console.log('User ID:', userId);
  
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    console.log('Document exists:', userSnap.exists());
    
    if (!userSnap.exists()) {
      console.error('❌ User document does not exist in Firestore!');
      return { success: false, error: 'Document not found' };
    }
    
    const data = userSnap.data();
    console.log('\n📄 Raw Firestore Data:');
    console.log(JSON.stringify(data, null, 2));
    
    console.log('\n🔎 Structure Check:');
    console.log('Has stats object:', !!data.stats);
    console.log('Has profile object:', !!data.profile);
    console.log('Has actionTypes object:', !!data.actionTypes);
    console.log('Has createdAt:', !!data.createdAt);
    
    if (data.stats) {
      console.log('\n📊 Stats Content:');
      console.log('  - totalCarbonSaved:', data.stats.totalCarbonSaved);
      console.log('  - currentStreak:', data.stats.currentStreak);
      console.log('  - longestStreak:', data.stats.longestStreak);
      console.log('  - totalActions:', data.stats.totalActions);
      console.log('  - coins:', data.stats.coins);
      console.log('  - level:', data.stats.level);
      console.log('  - weeklyGoal:', data.stats.weeklyGoal);
      console.log('  - monthlyGoal:', data.stats.monthlyGoal);
    } else {
      console.error('❌ Stats object is missing!');
    }
    
    if (data.profile) {
      console.log('\n👤 Profile Content:');
      console.log('  - email:', data.profile.email);
      console.log('  - displayName:', data.profile.displayName);
    } else {
      console.warn('⚠️ Profile object is missing!');
    }
    
    if (data.actionTypes) {
      console.log('\n🎯 Action Types:');
      console.log('  - transport:', data.actionTypes.transport);
      console.log('  - energy:', data.actionTypes.energy);
      console.log('  - food:', data.actionTypes.food);
      console.log('  - waste:', data.actionTypes.waste);
    } else {
      console.warn('⚠️ ActionTypes object is missing!');
    }
    
    // Check achievements subcollection
    const achievementsRef = collection(db, 'users', userId, 'achievements');
    const achievementsSnap = await getDocs(achievementsRef);
    console.log('\n🏆 Achievements:');
    console.log('  Count:', achievementsSnap.size);
    if (!achievementsSnap.empty) {
      achievementsSnap.forEach(doc => {
        const achievement = doc.data();
        console.log(`  - ${achievement.title}: ${achievement.unlocked ? '✅ Unlocked' : '🔒 Locked'}`);
      });
    }
    
    console.log('\n✅ ===== DEBUG COMPLETE =====\n');
    return { success: true, data };
    
  } catch (error: any) {
    console.error('\n❌ Debug Error:', error);
    console.error('Error message:', error?.message);
    console.error('Error code:', error?.code);
    return { success: false, error: error.message };
  }
};

/**
 * Verify all required fields exist
 */
export const verifyDataStructure = async (userId: string) => {
  console.log('\n✔️ ===== VERIFYING DATA STRUCTURE =====');
  
  const checks = {
    userDocExists: false,
    hasStatsObject: false,
    hasProfileObject: false,
    hasActionTypes: false,
    statsFieldsComplete: false,
    achievementsExist: false,
  };
  
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    checks.userDocExists = userSnap.exists();
    
    if (checks.userDocExists) {
      const data = userSnap.data();
      
      checks.hasStatsObject = !!data?.stats;
      checks.hasProfileObject = !!data?.profile;
      checks.hasActionTypes = !!data?.actionTypes;
      
      if (data?.stats) {
        checks.statsFieldsComplete = 
          typeof data.stats.totalCarbonSaved === 'number' &&
          typeof data.stats.currentStreak === 'number' &&
          typeof data.stats.totalActions === 'number' &&
          typeof data.stats.coins === 'number' &&
          typeof data.stats.level === 'number' &&
          typeof data.stats.weeklyGoal === 'number' &&
          typeof data.stats.monthlyGoal === 'number';
      }
      
      const achievementsRef = collection(db, 'users', userId, 'achievements');
      const achievementsSnap = await getDocs(achievementsRef);
      checks.achievementsExist = !achievementsSnap.empty;
    }
    
    // Print results
    console.log('\n📋 Verification Results:');
    Object.entries(checks).forEach(([key, value]) => {
      const icon = value ? '✅' : '❌';
      const label = key.replace(/([A-Z])/g, ' $1').trim();
      console.log(`${icon} ${label}`);
    });
    
    const allPassed = Object.values(checks).every(v => v === true);
    
    if (allPassed) {
      console.log('\n🎉 ALL CHECKS PASSED - Data structure is correct!');
    } else {
      console.log('\n⚠️ SOME CHECKS FAILED - Data structure needs fixing!');
    }
    
    console.log('\n✔️ ===== VERIFICATION COMPLETE =====\n');
    
    return { checks, allPassed };
    
  } catch (error: any) {
    console.error('Verification error:', error);
    return { checks, allPassed: false, error: error.message };
  }
};

/**
 * Quick test function - call this from your component
 */
export const quickTest = async (userId: string) => {
  console.log('🚀 Running quick test...\n');
  
  await debugUserData(userId);
  await verifyDataStructure(userId);
  
  console.log('🏁 Quick test complete!\n');
};

/**
 * Export all debug functions
 */
export default {
  debugUserData,
  verifyDataStructure,
  quickTest,
};
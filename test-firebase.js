// Test Firebase connection
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "",
  authDomain: "carbon-footprint-tracker-ca4f8.firebaseapp.com",
  projectId: "carbon-footprint-tracker-ca4f8",
  storageBucket: "carbon-footprint-tracker-ca4f8.firebasestorage.app",
  messagingSenderId: "613745171479",
  appId: "1:613745171479:web:3b3ef37ea5bc7e1ced5052",
  measurementId: "G-02Z8C87RNF"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Test function
async function testFirebaseConnection() {
  try {
    console.log('Testing Firebase connection...');
    
    // Test Firestore write
    const testDoc = doc(db, 'test', 'test-doc');
    await setDoc(testDoc, {
      message: 'Hello Firebase!',
      timestamp: new Date()
    });
    console.log('✅ Firestore write successful');
    
    // Test auth (optional - creates a test user)
    try {
      const userCred = await createUserWithEmailAndPassword(auth, 'test@test.com', 'test123');
      console.log('✅ Auth test successful - user created:', userCred.user.uid);
    } catch (authError) {
      if (authError.code === 'auth/email-already-in-use') {
        console.log('✅ Auth working - email already exists');
      } else {
        console.error('❌ Auth error:', authError);
      }
    }
    
  } catch (error) {
    console.error('❌ Firebase connection failed:', error);
  }
}

testFirebaseConnection();

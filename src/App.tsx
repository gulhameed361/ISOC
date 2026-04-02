import { useState, useEffect, useRef } from 'react';
import { 
  onAuthStateChanged, 
  User, 
  GoogleAuthProvider, 
  signInWithCredential 
} from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
// Import for v8.2.0
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { auth } from './firebase';

// Components
import { Layout } from './components/Layout';
import { HomeScreen } from './components/HomeScreen';
import { ScheduleScreen } from './components/ScheduleScreen';
import { ScanScreen } from './components/ScanScreen';
import { InfoScreen } from './components/InfoScreen';
import { LocationDetailScreen } from './components/LocationDetailScreen';
import { AppTab } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedMonth, setSelectedMonth] = useState<number>(Math.max(new Date().getMonth(), 2));

  const loginTimeoutRef = useRef<any>(null);

  // 1. Initial Auth Check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log("Firebase Auth Change:", currentUser?.email || "Logged Out");
      setUser(currentUser);
      setIsAuthReady(true);
      setIsLoggingIn(false);
      if (loginTimeoutRef.current) clearTimeout(loginTimeoutRef.current);
    });

    return () => unsubscribe();
  }, []);

  // 2. v8.2.0 Native Listener
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      // In v8.x, the listener returns an 'unlisten' function
      const promise = FirebaseAuthentication.addListener('authStateChange', (event) => {
        console.log("Native Auth Event:", event.user ? "User Present" : "No User");
        // Force React to sync with the Native user
        if (event.user) {
           // We don't manually set user here to avoid SDK conflicts
           // We let the onAuthStateChanged handle the UI flip
        }
      });
      
      return () => {
        promise.then(l => l.remove());
      };
    }
  }, []);

  const handleLogin = async () => {
    try {
      setAuthError(null);
      setIsLoggingIn(true);

      // 15s Timeout
      loginTimeoutRef.current = setTimeout(() => {
        setIsLoggingIn(false);
        setAuthError("Login timed out. Please try again.");
      }, 15000);

      if (Capacitor.isNativePlatform()) {
        // v8.2.0 Syntax
        const result = await FirebaseAuthentication.signInWithGoogle();

        if (result.credential) {
          const credential = GoogleAuthProvider.credential(
            result.credential.idToken,
            result.credential.accessToken
          );
          // Manually sign in the Web SDK so the UI updates
          await signInWithCredential(auth, credential);
        }
      } else {
        const { signInWithPopup, GoogleAuthProvider: WebProvider } = await import('firebase/auth');
        await signInWithPopup(auth, new WebProvider());
      }
    } catch (error: any) {
      console.error("Login Error:", error);
      setIsLoggingIn(false);
      if (loginTimeoutRef.current) clearTimeout(loginTimeoutRef.current);
      if (error.message?.includes('cancel')) return;
      setAuthError(error.code || "Failed to sign in.");
    }
  };

  // --- Rendering ---

  if (!isAuthReady) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8f9fa' }}>
        <div className="animate-spin" style={{ width: '30px', height: '30px', border: '4px solid #004d40', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
        <p style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>Starting ISOC App...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
        <div className="w-24 h-24 rounded-full bg-secondary-container flex items-center justify-center overflow-hidden mb-8 shadow-xl">
          <img alt="ISOC Logo" className="w-full h-full object-cover" src="./images/ISOC.png" />
        </div>
        <h1 className="font-headline font-extrabold text-3xl text-on-surface mb-2">ISOC Prayer Room</h1>
        <p className="font-body text-on-surface-variant text-center mb-12">Sign in to view schedules.</p>
        
        <button 
          onClick={handleLogin}
          disabled={isLoggingIn}
          className="bg-primary text-on-primary font-headline font-bold py-4 px-8 rounded-full shadow-lg w-full max-w-xs active:scale-95 transition-all"
        >
          {isLoggingIn ? 'Signing in...' : 'Continue with Google'}
        </button>

        {authError && <p style={{ color: 'red', marginTop: '20px' }}>{authError}</p>}
      </div>
    );
  }

  // --- Main App Views ---
  const renderScreen = () => {
    if (activeTab === 'info' && selectedLocationId) {
      return <LocationDetailScreen locationId={selectedLocationId} onBack={() => setSelectedLocationId(null)} />;
    }
    switch (activeTab) {
      case 'home': return <HomeScreen onViewCalendar={() => setActiveTab('schedule')} selectedDate={selectedDate} onDateChange={setSelectedDate} />;
      case 'schedule': return <ScheduleScreen selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} onDateChange={(date) => { setSelectedDate(date); setActiveTab('home'); }} />;
      case 'scan': return <ScanScreen />;
      case 'info': return <InfoScreen onLocationClick={setSelectedLocationId} />;
      default: return <HomeScreen />;
    }
  };

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderScreen()}
    </Layout>
  );
}
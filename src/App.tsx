import { useState, useEffect, useRef } from 'react';
import { 
  onAuthStateChanged, 
  User, 
  GoogleAuthProvider, 
  signInWithCredential 
} from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
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

const DEFAULT_START_MONTH = 2;

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedMonth, setSelectedMonth] = useState<number>(Math.max(new Date().getMonth(), DEFAULT_START_MONTH));

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 1. SINGLE SOURCE OF TRUTH: Listen for Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log('[Auth] State resolved:', currentUser?.email || 'null');
      setUser(currentUser);
      setIsAuthReady(true);
      
      // If we were in a loading state, clear it
      setIsLoggingIn(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setAuthError(null);
    setIsLoggingIn(true);

    // 15s Safety Net to prevent infinite spinner
    timeoutRef.current = setTimeout(() => {
      if (isLoggingIn && !user) {
        setIsLoggingIn(false);
        setAuthError("Sign-in timed out. Please check your connection.");
      }
    }, 15000);

    try {
      if (Capacitor.isNativePlatform()) {
        // Step A: Trigger Native iOS Popup
        const result = await FirebaseAuthentication.signInWithGoogle({
          scopes: ['email', 'profile'],
          skipNativeAuth: false // Plugin handles native session
        });

        // Step B: Manual Bridge - Feed token to Web SDK so React "sees" the user
        if (result.credential?.idToken) {
          const credential = GoogleAuthProvider.credential(
            result.credential.idToken,
            result.credential.accessToken ?? undefined
          );
          await signInWithCredential(auth, credential);
        }
      } else {
        // Web Fallback
        const { signInWithPopup, GoogleAuthProvider: Provider } = await import('firebase/auth');
        await signInWithPopup(auth, new Provider());
      }
    } catch (error: any) {
      setIsLoggingIn(false);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (error.message?.includes('cancel') || error.code?.includes('cancelled')) return;
      setAuthError(`${error.code || 'Error'}: ${error.message}`);
    }
  };

  // --- RENDERING ---

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-emerald-800 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-500">Initializing ISOC...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
        <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center overflow-hidden mb-8 shadow-lg">
          <img alt="Logo" className="w-full h-full object-cover" src="./images/ISOC.png" onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/150")} />
        </div>
        <h1 className="font-bold text-3xl text-slate-900 mb-2">ISOC Prayer Room</h1>
        <p className="text-slate-500 text-center mb-12">Sign in to access schedules.</p>
        <button 
          onClick={handleLogin}
          disabled={isLoggingIn}
          className="bg-emerald-800 text-white font-bold py-4 px-10 rounded-full shadow-lg w-full max-w-xs active:scale-95 transition-transform disabled:opacity-50"
        >
          {isLoggingIn ? 'Signing in...' : 'Continue with Google'}
        </button>
        {authError && <p className="mt-6 text-xs text-red-600 font-mono text-center">⚠️ {authError}</p>}
      </div>
    );
  }

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
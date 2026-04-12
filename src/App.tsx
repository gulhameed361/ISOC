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

  // 1. Monitor Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log('[Auth] User updated:', currentUser?.email || 'Logged Out');
      setUser(currentUser);
      setIsAuthReady(true);
      
      if (currentUser) {
        setIsLoggingIn(false);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      }
    });

    // Safety: Unlock initialization screen after 5 seconds
    const forceReady = setTimeout(() => setIsAuthReady(true), 5000);

    return () => {
      unsubscribe();
      clearTimeout(forceReady);
    };
  }, []);

  // 2. The Final Login Bridge
  const handleLogin = async () => {
    setAuthError(null);
    setIsLoggingIn(true);

    // Safety timeout for the "Signing in..." state
    timeoutRef.current = setTimeout(() => {
      if (isLoggingIn && !user) {
        setIsLoggingIn(false);
        setAuthError("Sign-in timed out. Ensure localhost is an Authorized Domain in Firebase.");
      }
    }, 25000);

    try {
      if (Capacitor.isNativePlatform()) {
        // A. Trigger Native Popup (skipNativeAuth: true is critical for bridge stability)
        const result = await FirebaseAuthentication.signInWithGoogle({
          skipNativeAuth: true 
        });

        if (result.credential?.idToken) {
          console.log("[Auth] Token received. Bridging to Web SDK...");
          const credential = GoogleAuthProvider.credential(
            result.credential.idToken,
            result.credential.accessToken ?? undefined
          );
          
          // B. This will now succeed with the correct API Key
          const userCredential = await signInWithCredential(auth, credential);
          
          if (userCredential.user) {
            setUser(userCredential.user);
            setIsLoggingIn(false);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
          }
        }
      } else {
        // Browser Fallback
        const { signInWithPopup, GoogleAuthProvider: Provider } = await import('firebase/auth');
        await signInWithPopup(auth, new Provider());
      }
    } catch (error: any) {
      console.error("[Auth] Login error:", error);
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
          <p className="text-sm font-medium text-slate-500">Connecting to ISOC...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
        <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center overflow-hidden mb-8 shadow-lg">
          <img 
            alt="Logo" 
            className="w-full h-full object-cover" 
            src="./images/ISOC.png" 
            onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/150")} 
          />
        </div>
        <h1 className="font-bold text-3xl text-slate-900 mb-2 text-center">ISOC Prayer Room</h1>
        <p className="text-slate-500 text-center mb-12 text-balance">Sign in to access your prayer schedule.</p>
        
        <button 
          onClick={handleLogin}
          disabled={isLoggingIn}
          className="bg-emerald-800 text-white font-bold py-4 px-10 rounded-full shadow-lg w-full max-w-xs active:scale-95 transition-transform disabled:opacity-50"
        >
          {isLoggingIn ? 'Signing in...' : 'Continue with Google'}
        </button>

        {authError && (
          <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-xl text-center max-w-xs">
            <p className="text-xs text-red-600 font-mono break-all font-medium">⚠️ {authError}</p>
          </div>
        )}
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
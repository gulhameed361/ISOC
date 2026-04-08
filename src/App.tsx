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

  // 1. Initial Auth Check (The "Heartbeat")
  useEffect(() => {
    const forceStartTimeout = setTimeout(() => {
      if (!isAuthReady) {
        console.warn("Auth check timed out, forcing UI...");
        setIsAuthReady(true);
      }
    }, 5000);

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      clearTimeout(forceStartTimeout);
      setUser(currentUser);
      setIsAuthReady(true);
      if (currentUser) {
        setIsLoggingIn(false);
        if (loginTimeoutRef.current) clearTimeout(loginTimeoutRef.current);
      }
    });

    return () => {
      unsubscribe();
      clearTimeout(forceStartTimeout);
    };
  }, [isAuthReady]);

  // 2. Direct Token Login Logic
  const handleLogin = async () => {
    try {
      setAuthError(null);
      setIsLoggingIn(true);
      console.log("App: Starting Login Process...");

      // 20s Safety Timeout for slow university networks
      loginTimeoutRef.current = setTimeout(() => {
        if (isLoggingIn && !user) {
          setIsLoggingIn(false);
          setAuthError("Sign-in timed out. Please check your connection or Google settings.");
        }
      }, 20000);

      if (Capacitor.isNativePlatform()) {
        // Trigger Native Popup
        const result = await FirebaseAuthentication.signInWithGoogle();
        console.log("App: Native Result Received");

        const idToken = result.credential?.idToken;
        if (!idToken) {
          throw new Error("No ID Token received from Google.");
        }

        // Force-bridge the token to the Web SDK
        const credential = GoogleAuthProvider.credential(idToken);
        const userCredential = await signInWithCredential(auth, credential);
        
        if (userCredential.user) {
          console.log("App: Login Successful!");
          setUser(userCredential.user); // Immediate state update
          setIsLoggingIn(false);
          if (loginTimeoutRef.current) clearTimeout(loginTimeoutRef.current);
        }
      } else {
        // Web Fallback
        const { signInWithPopup, GoogleAuthProvider: WebProvider } = await import('firebase/auth');
        await signInWithPopup(auth, new WebProvider());
      }
    } catch (error: any) {
      console.error("App: Detailed Login Error:", error);
      setIsLoggingIn(false);
      if (loginTimeoutRef.current) clearTimeout(loginTimeoutRef.current);
      
      // Ignore cancellations
      if (error.message?.includes('cancel') || error.code?.includes('cancelled')) return;
      
      setAuthError(`Code: ${error.code || 'Error'} | Msg: ${error.message || 'Check credentials'}`);
    }
  };

  // --- RENDERING ---

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-emerald-800 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-500 font-medium">Starting ISOC App...</p>
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
        <h1 className="font-bold text-3xl text-slate-900 mb-2">ISOC Prayer Room</h1>
        <p className="text-slate-500 text-center mb-12">Sign in to access schedules.</p>
        
        <button 
          onClick={handleLogin}
          disabled={isLoggingIn}
          className="bg-emerald-800 text-white font-bold py-4 px-10 rounded-full shadow-lg w-full max-w-xs active:scale-95 transition-all disabled:opacity-50"
        >
          {isLoggingIn ? 'Signing in...' : 'Continue with Google'}
        </button>

        {authError && (
          <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-xl text-center max-w-xs">
            <p className="text-xs text-red-600 font-mono break-all">⚠️ {authError}</p>
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
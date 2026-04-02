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

// Components - Ensure these paths match your folder structure exactly
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

  // 1. Initial Auth Check with 5-second "Heartbeat" Force-Start
  useEffect(() => {
    console.log("App: Initializing Auth Listener...");
    
    // If Firebase is silent for 5 seconds, force the UI to show the login screen
    const forceStartTimeout = setTimeout(() => {
      if (!isAuthReady) {
        console.warn("App: Firebase hang detected. Force-starting UI...");
        setIsAuthReady(true);
      }
    }, 5000);

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log("App: Firebase Auth State Changed ->", currentUser?.email || "Logged Out");
      clearTimeout(forceStartTimeout); 
      setUser(currentUser);
      setIsAuthReady(true);
      setIsLoggingIn(false);
      if (loginTimeoutRef.current) clearTimeout(loginTimeoutRef.current);
    });

    return () => {
      unsubscribe();
      clearTimeout(forceStartTimeout);
    };
  }, [isAuthReady]);

  // 2. Native Auth Listener (Specifically for Capacitor 6 / v8.2.0)
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      const setupListener = async () => {
        const handler = await FirebaseAuthentication.addListener('authStateChange', (event) => {
          console.log("App: Native Auth Event ->", event.user ? "User Detected" : "No User");
          // If a user is detected natively, we let onAuthStateChanged handle the UI flip
        });
        return handler;
      };

      const listenerPromise = setupListener();
      return () => {
        listenerPromise.then(l => l.remove());
      };
    }
  }, []);

  const handleLogin = async () => {
    try {
      setAuthError(null);
      setIsLoggingIn(true);
      console.log("App: Starting Login Flow...");

      // 15s Safety Timeout for the login button spinner
      loginTimeoutRef.current = setTimeout(() => {
        setIsLoggingIn(false);
        setAuthError("Sign-in timed out. Please try again.");
      }, 15000);

      if (Capacitor.isNativePlatform()) {
        // Native Google Sign-In
        const result = await FirebaseAuthentication.signInWithGoogle();

        if (result.credential) {
          console.log("App: Native tokens received, bridging to Web SDK...");
          const credential = GoogleAuthProvider.credential(
            result.credential.idToken ?? undefined,
            result.credential.accessToken ?? undefined
          );
          // This bridges the native session to the auth object in firebase.ts
          await signInWithCredential(auth, credential);
        }
      } else {
        // Web Browser Fallback
        const { signInWithPopup, GoogleAuthProvider: WebProvider } = await import('firebase/auth');
        await signInWithPopup(auth, new WebProvider());
      }
    } catch (error: any) {
      console.error("App: Login Error ->", error);
      setIsLoggingIn(false);
      if (loginTimeoutRef.current) clearTimeout(loginTimeoutRef.current);
      
      // Don't show error if user just swiped away the popup
      if (error.message?.includes('cancel') || error.code?.includes('cancelled')) return;
      
      setAuthError(error.code || "Authentication failed.");
    }
  };

  // --- RENDER LOGIC ---

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-emerald-800 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600 font-medium">Starting ISOC App...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
        <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center overflow-hidden mb-8 shadow-lg">
          <img 
            alt="ISOC Logo" 
            className="w-full h-full object-cover" 
            src="./images/ISOC.png" 
            onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/150")} 
          />
        </div>
        <h1 className="font-bold text-3xl text-slate-900 mb-2">ISOC Prayer Room</h1>
        <p className="text-slate-500 text-center mb-12">Sign in with your University account.</p>
        
        <button 
          onClick={handleLogin}
          disabled={isLoggingIn}
          className="bg-emerald-800 text-white font-bold py-4 px-10 rounded-full shadow-md w-full max-w-xs active:scale-95 transition-transform disabled:opacity-70"
        >
          {isLoggingIn ? 'Signing in...' : 'Continue with Google'}
        </button>

        {authError && (
          <div className="mt-6 p-3 bg-red-50 border border-red-100 rounded-lg">
            <p className="text-sm text-red-600 font-medium">⚠️ {authError}</p>
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
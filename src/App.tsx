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

  const loginTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 1. Monitor Auth State Changes (The "Heartbeat" Fix)
  useEffect(() => {
    console.log("Initializing Auth Listener...");
    
    // Safety: If Firebase hangs for more than 5 seconds, force the app to show the login screen
    const forceStartTimeout = setTimeout(() => {
      if (!isAuthReady) {
        console.warn("Firebase hang detected. Force-starting UI...");
        setIsAuthReady(true);
      }
    }, 5000);

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log("Auth State Changed:", currentUser?.email || "No User");
      clearTimeout(forceStartTimeout);
      setUser(currentUser);
      setIsAuthReady(true);
      
      // Clear login state if user successfully resolves
      if (currentUser) {
        setIsLoggingIn(false);
        if (loginTimeoutRef.current) {
          clearTimeout(loginTimeoutRef.current);
          loginTimeoutRef.current = null;
        }
      }
    });

    return () => {
      unsubscribe();
      clearTimeout(forceStartTimeout);
    };
  }, []);

  const handleLogin = async () => {
    setAuthError(null);
    setIsLoggingIn(true);

    // Safety timeout: If sign-in doesn't finish in 20s, unblock the UI
    loginTimeoutRef.current = setTimeout(() => {
      if (isLoggingIn && !user) {
        setIsLoggingIn(false);
        setAuthError("Sign-in timed out. Please check your connection.");
      }
    }, 20000);

    try {
      if (Capacitor.isNativePlatform()) {
        // Trigger the Native iOS System Popup
        const result = await FirebaseAuthentication.signInWithGoogle({
          scopes: ['email', 'profile'],
          skipNativeAuth: false,
        });

        // Direct Token Bridge: Hand the token to the Firebase Web SDK
        if (result.credential?.idToken) {
          const credential = GoogleAuthProvider.credential(
            result.credential.idToken,
            result.credential.accessToken ?? undefined
          );
          
          const userCredential = await signInWithCredential(auth, credential);
          
          if (userCredential.user) {
            setUser(userCredential.user);
            setIsLoggingIn(false);
            if (loginTimeoutRef.current) clearTimeout(loginTimeoutRef.current);
          }
        }
        return;
      }

      // Web Fallback
      const { signInWithPopup, GoogleAuthProvider: WebProvider } = await import('firebase/auth');
      const provider = new WebProvider();
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      setIsLoggingIn(false);
      if (loginTimeoutRef.current) clearTimeout(loginTimeoutRef.current);
      if (error.message?.includes('cancel') || error.code?.includes('cancelled')) return;
      setAuthError(`${error?.code || 'Error'}: Please try again.`);
    }
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm text-on-surface-variant font-medium">Starting ISOC App...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
        <div className="w-24 h-24 rounded-full bg-secondary-container flex items-center justify-center overflow-hidden mb-8 shadow-xl">
          <img
            alt="ISOC Logo"
            className="w-full h-full object-cover"
            src="./images/ISOC.png"
            onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/150")}
          />
        </div>
        <h1 className="font-headline font-extrabold text-3xl text-on-surface mb-2">ISOC Prayer Room</h1>
        <p className="font-body text-on-surface-variant text-center mb-12">Sign in to access schedules.</p>

        <button
          onClick={handleLogin}
          disabled={isLoggingIn}
          className="bg-primary text-on-primary font-headline font-bold py-4 px-8 rounded-full shadow-lg w-full max-w-xs active:scale-95 transition-transform disabled:opacity-50"
        >
          {isLoggingIn ? 'Signing in...' : 'Continue with Google'}
        </button>

        {authError && (
          <div className="mt-6 p-3 bg-red-50 border border-red-100 rounded-lg">
            <p className="text-sm text-red-600 text-center font-medium">⚠️ {authError}</p>
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
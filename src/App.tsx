import { useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  GoogleAuthProvider, 
  User, 
  signInWithCredential 
} from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { auth } from './firebase';
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

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!isAuthReady) {
        setAuthError("Auth Init Timeout - Check Config");
        setIsAuthReady(true); 
      }
    }, 10000);

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      clearTimeout(timeout);
      setUser(currentUser);
      setIsAuthReady(true);
    });

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, [isAuthReady]);

  const handleLogin = async () => {
    setAuthError(null);
    setIsLoggingIn(true);

    try {
      if (Capacitor.isNativePlatform()) {
        // 1. Native Call
        const result = await FirebaseAuthentication.signInWithGoogle({
          scopes: ['email', 'profile'],
          skipNativeAuth: false, 
        });

        if (result.credential) {
          // alert("Native Success! Bridging to Web SDK...");
          const credential = GoogleAuthProvider.credential(
            result.credential.idToken ?? undefined,
            result.credential.accessToken ?? undefined
          );
          
          await signInWithCredential(auth, credential);
          // alert("Firebase Web SDK Linked!");
        } else {
          throw new Error("No credentials returned from Google.");
        }

        setIsLoggingIn(false);
        return;
      }

      // Web Fallback
      const { signInWithPopup, GoogleAuthProvider: WebProvider } = await import('firebase/auth');
      const provider = new WebProvider();
      await signInWithPopup(auth, provider);
      setIsLoggingIn(false);
    } catch (error: any) {
      setIsLoggingIn(false);
      if (error.message?.includes('cancel')) return;
      
      const errorCode = error?.code || "unknown-error";
      const errorMessage = error?.message || "Check Firebase Console Settings";
      setAuthError(`${errorCode}: ${errorMessage}`);
      alert(`Login Error: ${errorCode}`);
    }
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm">Initializing ISOC...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
        <div className="w-24 h-24 rounded-full bg-secondary-container flex items-center justify-center overflow-hidden border-4 border-primary/10 mb-8 shadow-xl">
          <img 
            alt="ISOC Logo" 
            className="w-full h-full object-cover"
            src="./images/ISOC.png"
            onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/150")}
          />
        </div>
        <h1 className="font-headline font-extrabold text-3xl text-on-surface mb-2 text-center">ISOC Prayer Room</h1>
        <p className="font-body text-on-surface-variant text-center mb-12">Sign in to access schedules.</p>
        
        <button 
          onClick={handleLogin}
          disabled={isLoggingIn}
          className="bg-primary text-on-primary font-headline font-bold py-4 px-8 rounded-full shadow-lg w-full max-w-xs flex items-center justify-center gap-3"
        >
          {isLoggingIn ? 'Signing in...' : 'Continue with Google'}
        </button>

        {authError && (
          <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-200">
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
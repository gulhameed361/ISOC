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

  const timeoutRef = useRef<any>(null);
  const isAuthReadyRef = useRef(false);

  // 1. Monitor Auth State (Fixed dependency array)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
      isAuthReadyRef.current = true;
      if (currentUser) setIsLoggingIn(false);
    });

    const forceStart = setTimeout(() => {
      if (!isAuthReadyRef.current) setIsAuthReady(true);
    }, 5000);

    return () => {
      unsubscribe();
      clearTimeout(forceStart);
    };
  }, []); // Empty array is critical here!

  const handleLogin = async () => {
    setAuthError(null);
    setIsLoggingIn(true);

    try {
      if (Capacitor.isNativePlatform()) {
        const result = await FirebaseAuthentication.signInWithGoogle({
          skipNativeAuth: true 
        });

        if (result.credential?.idToken) {
          const credential = GoogleAuthProvider.credential(result.credential.idToken);
          const userCredential = await signInWithCredential(auth, credential);
          
          if (userCredential.user) {
            setUser(userCredential.user);
            setIsLoggingIn(false);
          }
        }
      } else {
        const { signInWithPopup, GoogleAuthProvider: Provider } = await import('firebase/auth');
        await signInWithPopup(auth, new Provider());
      }
    } catch (error: any) {
      setIsLoggingIn(false);
      if (error.message?.includes('cancel') || error.code?.includes('cancelled')) return;
      setAuthError(`${error.code || 'Error'}: ${error.message}`);
    }
  };

  if (!isAuthReady) {
    return <div className="min-h-screen flex items-center justify-center bg-white"><div className="animate-spin h-8 w-8 border-4 border-emerald-800 border-t-transparent rounded-full"></div></div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
        <div className="w-24 h-24 mb-8 shadow-lg rounded-full overflow-hidden bg-white flex items-center justify-center">
          <img alt="Logo" className="w-full h-full object-cover" src="./images/ISOC.png" />
        </div>
        <h1 className="font-bold text-3xl text-slate-900 mb-2">ISOC Prayer Room</h1>
        <button 
          onClick={handleLogin}
          disabled={isLoggingIn}
          className="bg-emerald-800 text-white font-bold py-4 px-10 rounded-full w-full max-w-xs active:scale-95 disabled:opacity-50"
        >
          {isLoggingIn ? 'Signing in...' : 'Continue with Google'}
        </button>
        {authError && <p className="mt-6 text-xs text-red-600 text-center px-4">⚠️ {authError}</p>}
      </div>
    );
  }

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'home' && <HomeScreen onViewCalendar={() => setActiveTab('schedule')} selectedDate={selectedDate} onDateChange={setSelectedDate} />}
      {activeTab === 'schedule' && <ScheduleScreen selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} onDateChange={(d) => { setSelectedDate(d); setActiveTab('home'); }} />}
      {activeTab === 'scan' && <ScanScreen />}
      {activeTab === 'info' && (selectedLocationId ? <LocationDetailScreen locationId={selectedLocationId} onBack={() => setSelectedLocationId(null)} /> : <InfoScreen onLocationClick={setSelectedLocationId} />)}
    </Layout>
  );
}
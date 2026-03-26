import { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, signInWithRedirect, getRedirectResult, User } from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import { auth, googleProvider } from './firebase';
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
  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());

  useEffect(() => {
    // On native platforms, login uses redirect flow instead of popup.
    if (Capacitor.isNativePlatform()) {
      getRedirectResult(auth).catch((error) => {
        console.error('Redirect login failed:', error);
      });
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      googleProvider.setCustomParameters({ prompt: 'select_account' });

      if (Capacitor.isNativePlatform()) {
        await signInWithRedirect(auth, googleProvider);
        return;
      }

      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  if (!isAuthReady) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
        <div className="w-24 h-24 rounded-full bg-secondary-container flex items-center justify-center overflow-hidden border-4 border-primary/10 mb-8 shadow-xl">
          <img 
            alt="ISOC Logo" 
            className="w-full h-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuC7x9onW-FLfHXV-NOvhon53sNsIcJjWJKDblaYYEiHQuEfiaWu-UkVZ5P7sXxCuL4qgRZ_iHdRkUX4QKzqteFddb8HFyKI-cd_93UdbMiBHWrVszhVL7_vzQpqs8vtvTPZ0-BFlxweDtQTH3wg9uvBgnkbFdyrasQK7fP-OQuRtdNBw49IubewtA4UvgSoI400Sbmf65NtJ-WWxb4V-bv2ELt-bsZw6pH5iT5Y_thrKTbn4QJGVn1U_hKGyg8QGMvsbFbcRTcPkA"
            referrerPolicy="no-referrer"
          />
        </div>
        <h1 className="font-headline font-extrabold text-3xl text-on-surface mb-2 text-center">ISOC Prayer Room</h1>
        <p className="font-body text-on-surface-variant text-center mb-12 max-w-xs">Sign in to access the latest prayer schedules and ISOC updates.</p>
        <button 
          onClick={handleLogin}
          className="bg-primary text-on-primary font-headline font-bold py-4 px-8 rounded-full shadow-lg hover:shadow-xl hover:bg-primary-container transition-all active:scale-95 w-full max-w-xs flex items-center justify-center gap-3"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            <path fill="none" d="M1 1h22v22H1z" />
          </svg>
          Continue with Google
        </button>
      </div>
    );
  }

  const renderScreen = () => {
    if (activeTab === 'info' && selectedLocationId) {
      return (
        <LocationDetailScreen 
          locationId={selectedLocationId} 
          onBack={() => setSelectedLocationId(null)} 
        />
      );
    }

    switch (activeTab) {
      case 'home': 
        return (
          <HomeScreen 
            onViewCalendar={() => setActiveTab('schedule')} 
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />
        );
      case 'schedule': 
        return (
          <ScheduleScreen 
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
            onDateChange={(date) => {
              setSelectedDate(date);
              setActiveTab('home');
            }}
          />
        );
      case 'scan': return <ScanScreen />;
      case 'info': return <InfoScreen onLocationClick={(id) => setSelectedLocationId(id)} />;
      default: return <HomeScreen />;
    }
  };

  const handleTabChange = (tab: AppTab) => {
    setActiveTab(tab);
    setSelectedLocationId(null); // Reset detail view when changing tabs
  };

  return (
    <Layout activeTab={activeTab} onTabChange={handleTabChange}>
      {renderScreen()}
    </Layout>
  );
}

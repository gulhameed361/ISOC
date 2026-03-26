import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { format, addDays, isSameDay } from 'date-fns';
import { MOCK_PRAYERS } from '../constants';
import { Bell, Sun, CloudSun, Moon, CloudMoon, Info, Heart, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { useSchedule } from '../hooks/useSchedule';

interface HomeScreenProps {
  onViewCalendar: () => void;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onViewCalendar, selectedDate, onDateChange }) => {
  const { schedule, loading, error } = useSchedule(selectedDate);
  
  // Find the schedule for the selected date, or default to today's mock data if no schedule exists
  const todaySchedule = schedule?.days.find(p => p.dateStr === format(selectedDate, 'yyyy-MM-dd')) || MOCK_PRAYERS.find(p => isSameDay(p.date, selectedDate)) || MOCK_PRAYERS[1];
  
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Calculate current and next prayer
  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  let currentPrayerIdx = -1;
  let nextPrayerIdx = 0;

  if (todaySchedule && todaySchedule.prayers) {
    for (let i = 0; i < todaySchedule.prayers.length; i++) {
      const timeStr = todaySchedule.prayers[i].athan;
      if (timeStr && timeStr.includes(':')) {
        const [h, m] = timeStr.split(':').map(Number);
        if (currentMinutes >= h * 60 + m) {
          currentPrayerIdx = i;
        }
      }
    }
    nextPrayerIdx = currentPrayerIdx + 1;
    if (nextPrayerIdx >= todaySchedule.prayers.length) {
      nextPrayerIdx = 0;
    }
  }

  const currentPrayer = currentPrayerIdx >= 0 ? todaySchedule?.prayers?.[currentPrayerIdx] : null;
  const nextPrayer = todaySchedule?.prayers?.[nextPrayerIdx];

  let timeLeftStr = "--:--:--";
  if (nextPrayer && nextPrayer.athan && nextPrayer.athan.includes(':')) {
    const [nextH, nextM] = nextPrayer.athan.split(':').map(Number);
    let targetTime = new Date(currentTime);
    targetTime.setHours(nextH, nextM, 0, 0);

    if (currentMinutes >= nextH * 60 + nextM) {
      targetTime = addDays(targetTime, 1);
    }

    const diffMs = targetTime.getTime() - currentTime.getTime();
    if (diffMs > 0) {
      const h = Math.floor(diffMs / (1000 * 60 * 60));
      const m = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diffMs % (1000 * 60)) / 1000);
      timeLeftStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <section>
        <p className="font-headline font-bold text-primary text-sm tracking-widest uppercase mb-1">Surrey Islamic Society</p>
        <h1 className="font-headline font-extrabold text-3xl text-on-surface tracking-tight">Today's Schedule</h1>
        <p className="text-on-surface-variant text-sm mt-1">{todaySchedule.date ? format(todaySchedule.date, 'EEEE, d MMMM') : format(selectedDate, 'EEEE, d MMMM')} • {todaySchedule.hijriDate}</p>
      </section>

      {loading && (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {!loading && !schedule && (
        <div className="bg-error-container text-on-error-container p-4 rounded-xl text-sm mb-4">
          No schedule uploaded for this month yet. Showing default mock data.
        </div>
      )}

      {/* Hero Countdown */}
      <motion.section 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative overflow-hidden bg-primary text-on-primary p-8 rounded-2xl shadow-lg"
      >
        <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20">
              <div className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse"></div>
              <span className="text-[10px] font-bold uppercase tracking-widest">Current: {currentPrayer ? currentPrayer.name : 'None'}</span>
            </div>
            <Bell className="w-5 h-5 opacity-60" />
          </div>
          
          <div className="mb-8">
            <p className="text-white/60 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Next: {nextPrayer?.name || 'Loading'}</p>
            <div className="flex items-baseline gap-3">
              <span className="font-headline font-black text-6xl tracking-tighter tabular-nums">{timeLeftStr}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 p-3 rounded-xl border border-white/10">
              <p className="text-[9px] text-white/50 uppercase font-bold tracking-wider mb-1">{nextPrayer?.name} Athan</p>
              <p className="text-xl font-bold tabular-nums">{nextPrayer?.athan || '--:--'}</p>
            </div>
            <div className="bg-white/5 p-3 rounded-xl border border-white/10">
              <p className="text-[9px] text-white/50 uppercase font-bold tracking-wider mb-1">{nextPrayer?.name} Iqama</p>
              <p className="text-xl font-bold tabular-nums">{nextPrayer?.iqama || '--:--'}</p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Weekly Summary */}
      <section>
        <div className="flex justify-between items-end mb-4 px-1">
          <div onClick={onViewCalendar} className="cursor-pointer hover:opacity-80 transition-opacity">
            <h2 className="font-headline font-bold text-xl text-on-surface">Weekly</h2>
            <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">{format(selectedDate, 'MMMM yyyy')}</p>
          </div>
          <button onClick={onViewCalendar} className="text-primary font-bold text-xs hover:underline">View Calendar</button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-4 hide-scrollbar snap-x">
          {[-3, -2, -1, 0, 1, 2, 3].map((offset) => {
            const date = addDays(selectedDate, offset);
            const isActive = isSameDay(date, selectedDate);
            const isToday = isSameDay(date, new Date());
            return (
              <div 
                key={offset}
                onClick={() => onDateChange(date)}
                className={cn(
                  "snap-center flex-shrink-0 w-20 p-4 rounded-2xl text-center transition-all duration-300 border cursor-pointer relative",
                  isActive 
                    ? "bg-primary text-on-primary border-primary shadow-md scale-105" 
                    : "bg-surface-container-lowest border-outline-variant/10 opacity-70 hover:opacity-100",
                  isToday && !isActive && "border-primary/50"
                )}
              >
                {isToday && <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-tertiary"></div>}
                <p className={cn("text-[9px] font-bold uppercase mb-2", isActive ? "text-white/70" : "text-on-surface-variant")}>{format(date, 'EEE')}</p>
                <p className="font-headline font-black text-2xl">{format(date, 'd')}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Prayer Times List */}
      <section className="space-y-2">
        <div className="flex items-center justify-between px-4 mb-2">
          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em]">Prayer</span>
          <div className="flex gap-12">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em]">Athan</span>
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em]">Iqama</span>
          </div>
        </div>
        
        {todaySchedule?.prayers?.map((prayer, idx) => {
          const isCurrent = currentPrayer?.name === prayer.name && isSameDay(selectedDate, new Date());
          return (
            <div 
              key={prayer.name}
              className={cn(
                "flex items-center justify-between p-4 rounded-2xl transition-all",
                isCurrent 
                  ? "bg-secondary-container text-on-secondary-container shadow-sm ring-1 ring-primary/20" 
                  : "bg-surface-container-lowest border border-outline-variant/5"
              )}
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  isCurrent ? "bg-primary text-on-primary" : "bg-surface-container"
                )}>
                  <PrayerIcon name={prayer.name} active={isCurrent} />
                </div>
                <span className="font-headline font-bold text-base">{prayer.name}</span>
              </div>
              
              <div className="flex gap-10 items-center pr-2">
                <span className="font-bold text-sm tabular-nums opacity-60">{prayer.athan}</span>
                <span className={cn("font-black text-base tabular-nums", isCurrent ? "text-primary" : "text-on-surface")}>{prayer.iqama}</span>
              </div>
            </div>
          );
        })}
      </section>

      {/* Jumu'ah Reminder */}
      <section className="p-6 bg-tertiary-fixed/30 rounded-xl border border-tertiary/10 flex items-start gap-4">
        <Info className="w-5 h-5 text-tertiary shrink-0" />
        <div>
          <p className="font-headline font-bold text-on-tertiary-fixed-variant text-sm mb-1">Jumu'ah Reminder</p>
          <p className="text-xs text-on-tertiary-fixed-variant/80 leading-relaxed">
            Tomorrow's Jumu'ah khutbah will be delivered by Sheikh Ahmed at 13:15. Please arrive early to ensure a spot.
          </p>
        </div>
      </section>

      {/* Rate App Button */}
      <a 
        href="https://play.google.com/store/apps/details?id=com.surreyisoc.prayerroom"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-24 right-6 w-14 h-14 bg-primary text-on-primary rounded-full shadow-2xl flex items-center justify-center active:scale-95 transition-transform z-40"
        title="Rate us 5 stars!"
      >
        <Heart className="w-6 h-6 fill-white" />
      </a>
    </div>
  );
};

const PrayerIcon = ({ name, active }: { name: string, active?: boolean }) => {
  const props = { className: cn("w-5 h-5", active ? "text-primary" : "text-primary/40") };
  switch (name) {
    case 'Fajr': return <Moon {...props} />;
    case 'Sunrise': return <Sun {...props} className="text-tertiary" />;
    case 'Dhuhr': return <Sun {...props} fill={active ? "currentColor" : "none"} />;
    case 'Asr': return <CloudSun {...props} />;
    case 'Maghrib': return <CloudMoon {...props} />;
    case 'Isha': return <Moon {...props} />;
    default: return <Sun {...props} />;
  }
};

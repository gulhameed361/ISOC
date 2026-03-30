import React from 'react';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { useSchedule } from '../hooks/useSchedule';
import { Loader2 } from 'lucide-react';

interface ScheduleScreenProps {
  selectedMonth: number;
  onMonthChange: (month: number) => void;
  onDateChange: (date: Date) => void;
}

const MONTHS = [
  { name: 'March', id: 2 },
  { name: 'April', id: 3 },
  { name: 'May', id: 4 },
  { name: 'June', id: 5 },
];

export const ScheduleScreen: React.FC<ScheduleScreenProps> = ({ selectedMonth, onMonthChange, onDateChange }) => {
  const currentYear = new Date().getFullYear();
  const currentMonthName = MONTHS.find(m => m.id === selectedMonth)?.name || 'MARCH';
  const daysInMonth = new Date(currentYear, selectedMonth + 1, 0).getDate();
  const { schedule, loading } = useSchedule(new Date(currentYear, selectedMonth, 1));

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <section className="text-center">
        <h1 className="font-headline text-2xl font-bold tracking-tight text-primary uppercase">Prayer Timetable - {currentMonthName} {currentYear}</h1>
        <p className="text-on-surface-variant text-xs mt-1 font-medium">(1447 AH)</p>
        <div className="mt-2 text-[10px] text-on-surface-variant space-y-0.5 opacity-80">
          <p>Islamic Prayer Centre, AA Building, University of Surrey, GU2 7XH</p>
          <p>Manor Park Prayer Room, JB01-10, James Black Road, GU2 7YW</p>
        </div>
      </section>

      {/* Month Selector */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 justify-center">
        {MONTHS.map((month) => (
          <button 
            key={month.id}
            onClick={() => onMonthChange(month.id)}
            className={cn(
              "flex-shrink-0 px-4 py-1.5 rounded-full font-medium text-xs transition-all",
              selectedMonth === month.id ? "bg-primary text-on-primary" : "bg-secondary-container text-on-secondary-container"
            )}
          >
            {month.name}
          </button>
        ))}
      </div>

      {/* Timetable Grid */}
      <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm border border-outline-variant/20">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !schedule ? (
          <div className="p-8 text-center text-on-surface-variant text-sm">
            No schedule uploaded for {currentMonthName} {currentYear} yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[10px]">
              <thead>
                <tr className="bg-surface-container-high">
                  <th className="p-2 border border-outline-variant/10" rowSpan={2}>Day</th>
                  <th className="p-2 border border-outline-variant/10 text-primary" colSpan={2}>Fajr</th>
                  <th className="p-2 border border-outline-variant/10 text-tertiary" rowSpan={2}>Sunrise</th>
                  <th className="p-2 border border-outline-variant/10 text-primary" colSpan={2}>Dhuhr / Jumu'ah</th>
                  <th className="p-2 border border-outline-variant/10 text-primary" colSpan={2}>Asr</th>
                  <th className="p-2 border border-outline-variant/10 text-primary" colSpan={2}>Maghrib</th>
                  <th className="p-2 border border-outline-variant/10 text-primary" colSpan={2}>Isha</th>
                </tr>
                <tr className="bg-surface-container-low text-[8px]">
                  <th className="p-1 border border-outline-variant/10">Ath</th><th className="p-1 border border-outline-variant/10">Iqa</th>
                  <th className="p-1 border border-outline-variant/10">Ath</th><th className="p-1 border border-outline-variant/10">Iqa</th>
                  <th className="p-1 border border-outline-variant/10">Ath</th><th className="p-1 border border-outline-variant/10">Iqa</th>
                  <th className="p-1 border border-outline-variant/10">Ath</th><th className="p-1 border border-outline-variant/10">Iqa</th>
                  <th className="p-1 border border-outline-variant/10">Ath</th><th className="p-1 border border-outline-variant/10">Iqa</th>
                </tr>
              </thead>
              <tbody className="text-center">
                {schedule.days.map((dayData, index) => {
                  const date = new Date(dayData.dateStr);
                  const day = date.getDate();
                  const dayName = format(date, 'EEE');
                  const isFriday = dayName === 'Fri';
                  const isToday = selectedMonth === new Date().getMonth() && day === new Date().getDate() && currentYear === new Date().getFullYear();
                  
                  const getPrayer = (name: string) => dayData.prayers.find(p => p.name === name) || { athan: '-', iqama: '-' };
                  const fajr = getPrayer('Fajr');
                  const dhuhr = getPrayer('Dhuhr');
                  const asr = getPrayer('Asr');
                  const maghrib = getPrayer('Maghrib');
                  const isha = getPrayer('Isha');

                  return (
                    <tr 
                      key={day} 
                      onClick={() => onDateChange(date)}
                      className={cn(
                        "transition-colors cursor-pointer",
                        isToday ? "bg-primary/10" : "hover:bg-surface-container-low",
                        isFriday && !isToday && "bg-surface-container-low/50"
                      )}
                    >
                      <td className="p-2 border border-outline-variant/10 font-bold whitespace-nowrap">
                        {day} {dayName}
                      </td>
                      <td className="p-2 border border-outline-variant/10">{fajr.athan}</td>
                      <td className="p-2 border border-outline-variant/10">{fajr.iqama}</td>
                      <td className="p-2 border border-outline-variant/10 bg-tertiary/5">{dayData.sunrise}</td>
                      <td className="p-2 border border-outline-variant/10">{dhuhr.athan}</td>
                      <td className={cn("p-2 border border-outline-variant/10", isFriday && "bg-primary/20 font-bold text-primary")}>
                        {isFriday ? (dhuhr.iqama || '').split('/')[0]?.trim() || '-' : dhuhr.iqama}
                      </td>
                      <td className="p-2 border border-outline-variant/10">{asr.athan}</td>
                      <td className="p-2 border border-outline-variant/10">{asr.iqama}</td>
                      <td className="p-2 border border-outline-variant/10">{maghrib.athan}</td>
                      <td className="p-2 border border-outline-variant/10 font-bold">{maghrib.iqama}</td>
                      <td className="p-2 border border-outline-variant/10">{isha.athan}</td>
                      <td className="p-2 border border-outline-variant/10">{isha.iqama}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Legend */}
      <footer className="mt-4 px-2">
        <div className="grid grid-cols-2 gap-4 items-start mb-6">
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-on-surface-variant uppercase">Venues:</p>
            <div className="flex items-center gap-2">
              <div className="w-6 h-3 bg-primary rounded-sm"></div>
              <span className="text-[10px] text-on-surface">Islamic Prayer Centre</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-3 bg-secondary-container rounded-sm"></div>
              <span className="text-[10px] text-on-surface">Manor Park Room</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[9px] text-on-surface-variant leading-tight">
              Reference: <span className="font-bold">Masjid Al-Birr</span>.<br/>
              Guildford times shown.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

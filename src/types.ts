export interface PrayerTime {
  name: string;
  athan: string;
  iqama: string;
  icon: string;
}

export interface DaySchedule {
  date: Date;
  hijriDate: string;
  prayers: PrayerTime[];
  sunrise: string;
}

export type AppTab = 'home' | 'schedule' | 'scan' | 'info';

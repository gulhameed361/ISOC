import { DaySchedule } from './types';

export const MOCK_PRAYERS: DaySchedule[] = [
  {
    date: new Date(2026, 2, 1), // March 1
    hijriDate: "12 Ramadan 1447",
    sunrise: "06:47",
    prayers: [
      { name: "Fajr", athan: "05:17", iqama: "05:30", icon: "dark_mode" },
      { name: "Dhuhr", athan: "12:15", iqama: "12:30", icon: "sunny" },
      { name: "Asr", athan: "15:07", iqama: "15:20", icon: "partly_cloudy_day" },
      { name: "Maghrib", athan: "17:43", iqama: "17:48", icon: "clear_night" },
      { name: "Isha", athan: "19:13", iqama: "19:30", icon: "bedtime" },
    ]
  },
  {
    date: new Date(2026, 2, 2), // March 2
    hijriDate: "13 Ramadan 1447",
    sunrise: "06:45",
    prayers: [
      { name: "Fajr", athan: "05:15", iqama: "05:30", icon: "dark_mode" },
      { name: "Dhuhr", athan: "12:15", iqama: "12:30", icon: "sunny" },
      { name: "Asr", athan: "15:08", iqama: "15:20", icon: "partly_cloudy_day" },
      { name: "Maghrib", athan: "17:45", iqama: "17:50", icon: "clear_night" },
      { name: "Isha", athan: "19:15", iqama: "19:30", icon: "bedtime" },
    ]
  },
  {
    date: new Date(2026, 2, 6), // March 6 (Friday)
    hijriDate: "17 Ramadan 1447",
    sunrise: "06:36",
    prayers: [
      { name: "Fajr", athan: "05:06", iqama: "05:30", icon: "dark_mode" },
      { name: "Dhuhr", athan: "12:14", iqama: "13:05", icon: "sunny" }, // Jumu'ah
      { name: "Asr", athan: "15:13", iqama: "15:20", icon: "partly_cloudy_day" },
      { name: "Maghrib", athan: "17:52", iqama: "17:57", icon: "clear_night" },
      { name: "Isha", athan: "19:22", iqama: "19:30", icon: "bedtime" },
    ]
  }
];

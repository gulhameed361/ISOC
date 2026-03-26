import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export interface Prayer {
  name: string;
  athan: string;
  iqama: string;
}

export interface DaySchedule {
  dateStr: string;
  hijriDate: string;
  sunrise: string;
  prayers: Prayer[];
}

export interface MonthlySchedule {
  month: string;
  uploadedBy: string;
  uploadedAt: string;
  days: DaySchedule[];
}

export function useSchedule(date: Date) {
  const [schedule, setSchedule] = useState<MonthlySchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const monthId = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const docRef = doc(db, 'schedules', monthId);

    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        setSchedule(snapshot.data() as MonthlySchedule);
      } else {
        setSchedule(null);
      }
      setLoading(false);
    }, (err) => {
      console.error("Error fetching schedule:", err);
      setError(err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [date.getFullYear(), date.getMonth()]);

  return { schedule, loading, error };
}

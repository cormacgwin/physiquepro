
export type Gender = 'male' | 'female';
export type Unit = 'metric' | 'imperial';

export interface UserProfile {
  name: string;
  age: number;
  gender: Gender;
  height: number; // in cm
  weight: number; // in kg
  wristSize: number; // in cm
}

export interface Measurements {
  neck: number;
  chest: number;
  waist: number;
  shoulders: number;
  biceps: number;
  forearms: number;
  hips: number;
  thighs: number;
  calves: number;
}

export interface HistoryEntry extends Measurements {
  id: string;
  timestamp: string;
  weight: number;
}

export interface ComparisonData {
  label: string;
  key: keyof Measurements;
  current: number;
  average: number;
  ideal: number;
  min: number; // "Very Small" bound for spectrum
  max: number; // "Very Large" bound for spectrum
  unit: string;
  spectrumPosition: number; // 0-100% on the visible bar
  idealPosition: number; // 0-100%
  avgPosition: number; // 0-100%
}

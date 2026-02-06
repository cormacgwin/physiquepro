
import { Measurements } from './types';

/**
 * Average Data Source: 
 * CDC National Center for Health Statistics (NCHS) 
 * Data Brief No. 464, Anthropometric Reference Data for Children and Adults: United States, 2015–2018.
 * (Normalized for 5'9" male / 5'4" female)
 */

export const AVERAGE_MALE: Measurements = {
  neck: 39.1,
  chest: 104.5,
  waist: 101.9,
  shoulders: 118.0,
  biceps: 34.2,
  forearms: 28.5,
  hips: 102.5,
  thighs: 55.4,
  calves: 37.5,
};

export const AVERAGE_FEMALE: Measurements = {
  neck: 33.5,
  chest: 94.0,
  waist: 98.3,
  shoulders: 102.0,
  biceps: 30.1,
  forearms: 24.5,
  hips: 105.0,
  thighs: 56.5,
  calves: 35.8,
};

/**
 * Scientific Ideal Source: 
 * The John McCallum 'Grecian Ideal' formulas for classic bodybuilding proportions.
 * Based on bone structure (Wrist Size).
 */
export const calculateIdeals = (wrist: number): Measurements => {
  const chest = wrist * 6.5;
  return {
    chest: chest,
    neck: chest * 0.37,
    waist: chest * 0.70,
    shoulders: chest * 1.25, // Estimation based on modern V-taper standards
    biceps: chest * 0.36,
    forearms: chest * 0.29,
    hips: chest * 0.85,
    thighs: chest * 0.53,
    calves: chest * 0.34,
  };
};

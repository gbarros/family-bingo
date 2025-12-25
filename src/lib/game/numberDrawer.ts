// Random number drawer for bingo game
// Draws numbers from 1-75, excluding already drawn numbers

import { MIN_NUMBER, MAX_NUMBER } from '../utils/constants';

/**
 * Draw a random number that hasn't been drawn yet
 * @param drawnNumbers - Set of already drawn numbers
 * @returns New random number, or null if all numbers drawn
 */
export function drawRandomNumber(drawnNumbers: Set<number>): number | null {
  // Get available numbers
  const available: number[] = [];

  for (let num = MIN_NUMBER; num <= MAX_NUMBER; num++) {
    if (!drawnNumbers.has(num)) {
      available.push(num);
    }
  }

  // All numbers drawn
  if (available.length === 0) {
    return null;
  }

  // Pick random from available
  const randomIndex = Math.floor(Math.random() * available.length);
  return available[randomIndex];
}

/**
 * Get list of all available numbers (not yet drawn)
 */
export function getAvailableNumbers(drawnNumbers: Set<number>): number[] {
  const available: number[] = [];

  for (let num = MIN_NUMBER; num <= MAX_NUMBER; num++) {
    if (!drawnNumbers.has(num)) {
      available.push(num);
    }
  }

  return available;
}

/**
 * Check if all numbers have been drawn
 */
export function allNumbersDrawn(drawnNumbers: Set<number>): boolean {
  return drawnNumbers.size >= MAX_NUMBER;
}

/**
 * Get total count of numbers in game
 */
export function getTotalNumbersCount(): number {
  return MAX_NUMBER - MIN_NUMBER + 1; // 75
}

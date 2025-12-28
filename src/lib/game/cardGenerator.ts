// Bingo card generator for 5x5 cards (75-ball bingo)
// B: 1-15, I: 16-30, N: 31-45, G: 46-60, O: 61-75
// Center position (12) is FREE space (value 0)

import { COLUMN_RANGES, CARD_SIZE, FREE_SPACE_INDEX } from '../utils/constants';

/**
 * Generate a valid 5x5 bingo card
 * Returns array of 25 numbers in column-major order
 * [B1, B2, B3, B4, B5, I1, I2, I3, I4, I5, ...]
 * Position 12 (center) will be 0 (FREE space)
 */
export function generateCard(): number[] {
  const card: number[] = [];

  // Generate each column
  for (let col = 0; col < CARD_SIZE; col++) {
    const [min, max] = COLUMN_RANGES[col];

    // Create array of available numbers for this column
    const available: number[] = [];
    for (let num = min; num <= max; num++) {
      available.push(num);
    }

    // Shuffle and pick 5 numbers
    const shuffled = shuffleArray(available);
    const selected = shuffled.slice(0, CARD_SIZE);


    // Add to card
    for (const num of selected) {
      card.push(num);
    }
  }

  // Set center position as FREE (0)
  card[FREE_SPACE_INDEX] = 0;

  return card;
}

/**
 * Validate that a card is properly formatted
 */
export function validateCard(card: number[]): boolean {
  if (card.length !== 25) return false;

  // Check center is FREE
  if (card[FREE_SPACE_INDEX] !== 0) return false;

  // Check each column has correct range
  for (let col = 0; col < CARD_SIZE; col++) {
    const [min, max] = COLUMN_RANGES[col];

    for (let row = 0; row < CARD_SIZE; row++) {
      const position = col * CARD_SIZE + row;

      // Skip FREE space
      if (position === FREE_SPACE_INDEX) continue;

      const number = card[position];

      // Check number is in valid range for column
      if (number < min || number > max) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Fisher-Yates shuffle
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Get number at specific row and column
 */
export function getNumberAtPosition(card: number[], row: number, col: number): number {
  return card[col * CARD_SIZE + row];
}

/**
 * Check if a number exists on the card
 */
export function hasNumber(card: number[], number: number): boolean {
  return card.includes(number);
}

// Bingo validator for all game modes
// Validates if a player has a winning pattern

import type { GameMode } from '@/types/game';
import { CARD_SIZE, FREE_SPACE_INDEX } from '../utils/constants';

/**
 * Validate if player has BINGO for given game mode
 * @param card - Player's card (25 numbers, position 12 is 0 for FREE)
 * @param markings - Boolean array of marked positions (25 elements)
 * @param mode - Game mode (horizontal, vertical, diagonal, blackout)
 * @returns true if player has valid BINGO
 */
export function validateBingo(
  card: number[],
  markings: boolean[],
  mode: GameMode
): boolean {
  // Ensure FREE space is marked
  if (!markings[FREE_SPACE_INDEX]) {
    markings = [...markings];
    markings[FREE_SPACE_INDEX] = true;
  }

  switch (mode) {
    case 'horizontal':
      return checkHorizontal(markings);

    case 'vertical':
      return checkVertical(markings);

    case 'diagonal':
      return checkDiagonal(markings);

    case 'blackout':
      return checkBlackout(markings);

    default:
      return false;
  }
}

/**
 * Check for any horizontal line (any row complete)
 */
function checkHorizontal(markings: boolean[]): boolean {
  for (let row = 0; row < CARD_SIZE; row++) {
    let isComplete = true;

    for (let col = 0; col < CARD_SIZE; col++) {
      const position = col * CARD_SIZE + row;

      if (!markings[position]) {
        isComplete = false;
        break;
      }
    }

    if (isComplete) return true;
  }

  return false;
}

/**
 * Check for any vertical line (any column complete)
 */
function checkVertical(markings: boolean[]): boolean {
  for (let col = 0; col < CARD_SIZE; col++) {
    let isComplete = true;

    for (let row = 0; row < CARD_SIZE; row++) {
      const position = col * CARD_SIZE + row;

      if (!markings[position]) {
        isComplete = false;
        break;
      }
    }

    if (isComplete) return true;
  }

  return false;
}

/**
 * Check for any diagonal (top-left to bottom-right OR top-right to bottom-left)
 */
function checkDiagonal(markings: boolean[]): boolean {
  // Diagonal 1: top-left to bottom-right (positions 0, 6, 12, 18, 24)
  // In column-major: [col*5 + row] where row === col
  const diagonal1 = [0, 6, 12, 18, 24];
  const isDiagonal1Complete = diagonal1.every(pos => markings[pos]);

  if (isDiagonal1Complete) return true;

  // Diagonal 2: top-right to bottom-left (positions 20, 16, 12, 8, 4)
  // In column-major: [col*5 + row] where row === (4 - col)
  const diagonal2 = [20, 16, 12, 8, 4];
  const isDiagonal2Complete = diagonal2.every(pos => markings[pos]);

  return isDiagonal2Complete;
}

/**
 * Check for blackout (all 25 positions marked)
 */
function checkBlackout(markings: boolean[]): boolean {
  return markings.every(marked => marked);
}

/**
 * Get which pattern the player won with (for display purposes)
 * Returns null if no win
 */
export function getWinningPattern(
  card: number[],
  markings: boolean[],
  mode: GameMode
): string | null {
  if (!validateBingo(card, markings, mode)) {
    return null;
  }

  switch (mode) {
    case 'horizontal':
      return getHorizontalPattern(markings);
    case 'vertical':
      return getVerticalPattern(markings);
    case 'diagonal':
      return getDiagonalPattern(markings);
    case 'blackout':
      return 'Cartela Cheia';
    default:
      return null;
  }
}

function getHorizontalPattern(markings: boolean[]): string {
  for (let row = 0; row < CARD_SIZE; row++) {
    let isComplete = true;

    for (let col = 0; col < CARD_SIZE; col++) {
      if (!markings[col * CARD_SIZE + row]) {
        isComplete = false;
        break;
      }
    }

    if (isComplete) return `Linha Horizontal ${row + 1}`;
  }

  return 'Linha Horizontal';
}

function getVerticalPattern(markings: boolean[]): string {
  for (let col = 0; col < CARD_SIZE; col++) {
    let isComplete = true;

    for (let row = 0; row < CARD_SIZE; row++) {
      if (!markings[col * CARD_SIZE + row]) {
        isComplete = false;
        break;
      }
    }

    if (isComplete) {
      const letters = ['B', 'I', 'N', 'G', 'O'];
      return `Linha Vertical ${letters[col]}`;
    }
  }

  return 'Linha Vertical';
}

function getDiagonalPattern(markings: boolean[]): string {
  const diagonal1 = [0, 6, 12, 18, 24];
  if (diagonal1.every(pos => markings[pos])) {
    return 'Diagonal Principal';
  }

  const diagonal2 = [20, 16, 12, 8, 4];
  if (diagonal2.every(pos => markings[pos])) {
    return 'Diagonal Secundária';
  }

  return 'Diagonal';
}

// Helper utility functions

import { COLUMN_LETTERS, COLUMN_RANGES } from './constants';

/**
 * Get column letter for a number (B, I, N, G, O)
 */
export function getColumnLetter(number: number): string {
  if (number >= 1 && number <= 15) return 'B';
  if (number >= 16 && number <= 30) return 'I';
  if (number >= 31 && number <= 45) return 'N';
  if (number >= 46 && number <= 60) return 'G';
  if (number >= 61 && number <= 75) return 'O';
  return '?';
}

/**
 * Get column index (0-4) for a position (0-24) in column-major order
 */
export function getColumnIndex(position: number): number {
  return Math.floor(position / 5);
}

/**
 * Get row index (0-4) for a position (0-24) in column-major order
 */
export function getRowIndex(position: number): number {
  return position % 5;
}

/**
 * Convert position (0-24) to row and column
 */
export function positionToRowCol(position: number): [number, number] {
  const col = Math.floor(position / 5);
  const row = position % 5;
  return [row, col];
}

/**
 * Convert row and column to position (0-24)
 */
export function rowColToPosition(row: number, col: number): number {
  return col * 5 + row;
}

/**
 * Format timestamp to readable string
 */
export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString('pt-BR');
}

/**
 * Shuffle array in place
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

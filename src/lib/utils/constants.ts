// Game constants for 75-ball bingo

// Column ranges for 5x5 bingo card
// B: 1-15, I: 16-30, N: 31-45, G: 46-60, O: 61-75
export const COLUMN_RANGES = [
  [1, 15],   // B
  [16, 30],  // I
  [31, 45],  // N
  [46, 60],  // G
  [61, 75],  // O
] as const;

export const COLUMN_LETTERS = ['B', 'I', 'N', 'G', 'O'] as const;

export const CARD_SIZE = 5;
export const TOTAL_CELLS = 25;
export const FREE_SPACE_INDEX = 12; // Center of 5x5 grid (row 2, col 2)

export const MIN_NUMBER = 1;
export const MAX_NUMBER = 75;

// Game modes
export const GAME_MODES = {
  HORIZONTAL: 'horizontal',
  VERTICAL: 'vertical',
  DIAGONAL: 'diagonal',
  BLACKOUT: 'blackout',
} as const;

// Winning patterns for each mode
export const WINNING_PATTERNS = {
  horizontal: 'Linha Horizontal',
  vertical: 'Linha Vertical',
  diagonal: 'Diagonal',
  blackout: 'Cartela Cheia',
} as const;

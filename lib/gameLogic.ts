// Taş Kağıt Makas
export type RockPaperScissorsChoice = 'rock' | 'paper' | 'scissors';

export interface RockPaperScissorsResult {
  winner: string | null; // 'player1' | 'player2' | 'draw'
  player1Choice: RockPaperScissorsChoice | null;
  player2Choice: RockPaperScissorsChoice | null;
}

export function determineRockPaperScissorsWinner(
  player1Choice: RockPaperScissorsChoice,
  player2Choice: RockPaperScissorsChoice
): RockPaperScissorsResult['winner'] {
  if (player1Choice === player2Choice) {
    return 'draw';
  }

  const winConditions: Record<RockPaperScissorsChoice, RockPaperScissorsChoice> = {
    rock: 'scissors',
    paper: 'rock',
    scissors: 'paper',
  };

  return winConditions[player1Choice] === player2Choice ? 'player1' : 'player2';
}

// Tic Tac Toe
export type TicTacToeMark = 'X' | 'O' | null;
export type TicTacToeBoard = TicTacToeMark[];

export interface TicTacToeResult {
  winner: TicTacToeMark;
  winningLine: number[] | null;
  isDraw: boolean;
}

export function createEmptyBoard(): TicTacToeBoard {
  return Array(9).fill(null);
}

export function checkTicTacToeWinner(board: TicTacToeBoard): TicTacToeResult {
  const winningLines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
    [0, 4, 8], [2, 4, 6], // diagonals
  ];

  for (const line of winningLines) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return {
        winner: board[a],
        winningLine: line,
        isDraw: false,
      };
    }
  }

  const isDraw = board.every((cell) => cell !== null);

  return {
    winner: null,
    winningLine: null,
    isDraw,
  };
}

// Sayı Tahmin Oyunu
export interface NumberGuessingState {
  targetNumber: number | null;
  minRange: number;
  maxRange: number;
  guesses: number[];
  hints: string[];
  isGameOver: boolean;
  winner: string | null;
}

export function generateHint(
  guess: number,
  target: number,
  minRange: number,
  maxRange: number
): string {
  if (guess === target) {
    return 'Doğru!';
  }

  const difference = Math.abs(guess - target);
  const range = maxRange - minRange;

  if (difference <= range * 0.1) {
    return guess < target ? 'Çok yakın, biraz daha büyük!' : 'Çok yakın, biraz daha küçük!';
  } else if (difference <= range * 0.3) {
    return guess < target ? 'Yakın, daha büyük bir sayı dene!' : 'Yakın, daha küçük bir sayı dene!';
  } else {
    return guess < target ? 'Çok daha büyük bir sayı dene!' : 'Çok daha küçük bir sayı dene!';
  }
}


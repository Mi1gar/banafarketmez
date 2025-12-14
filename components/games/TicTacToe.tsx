'use client';

import React from 'react';
import { TicTacToeBoard, TicTacToeMark } from '@/lib/gameLogic';

interface TicTacToeProps {
  board: TicTacToeBoard;
  currentPlayer: string;
  player1Name: string;
  player2Name: string;
  player1Mark: TicTacToeMark;
  player2Mark: TicTacToeMark;
  winner: TicTacToeMark | null;
  winningLine: number[] | null;
  isDraw: boolean;
  onMove: (index: number) => void;
}

export const TicTacToe: React.FC<TicTacToeProps> = ({
  board,
  currentPlayer,
  player1Name,
  player2Name,
  player1Mark,
  player2Mark,
  winner,
  winningLine,
  isDraw,
  onMove,
}) => {
  const isPlayerTurn =
    (currentPlayer === player1Name && player1Mark === 'X') ||
    (currentPlayer === player2Name && player2Mark === 'X');

  const getMarkDisplay = (mark: TicTacToeMark) => {
    if (mark === 'X') return '❌';
    if (mark === 'O') return '⭕';
    return '';
  };

  const isWinningCell = (index: number) => {
    return winningLine?.includes(index) || false;
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold mb-2">Tic Tac Toe</h2>
        <div className="flex justify-center gap-4 mb-2">
          <div className="text-sm">
            <span className="font-semibold">{player1Name}</span>: {getMarkDisplay(player1Mark)}
          </div>
          <div className="text-sm">
            <span className="font-semibold">{player2Name}</span>: {getMarkDisplay(player2Mark)}
          </div>
        </div>
        {!winner && !isDraw && (
          <p className="text-lg">
            Sıra:{' '}
            <span className="font-semibold">
              {currentPlayer === player1Name ? player1Name : player2Name}
            </span>
          </p>
        )}
        {winner && (
          <p className="text-xl font-bold text-green-600">
            {winner === player1Mark ? player1Name : player2Name} kazandı! 🎉
          </p>
        )}
        {isDraw && (
          <p className="text-xl font-bold text-yellow-600">Berabere!</p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 max-w-md mx-auto">
        {board.map((cell, index) => (
          <button
            key={index}
            onClick={() => {
              if (!cell && !winner && !isDraw && isPlayerTurn) {
                onMove(index);
              }
            }}
            disabled={!!cell || !!winner || isDraw || !isPlayerTurn}
            className={`
              w-24 h-24 text-4xl font-bold rounded-lg transition-colors
              ${cell ? 'bg-gray-100' : 'bg-gray-200 hover:bg-gray-300'}
              ${isWinningCell(index) ? 'bg-green-200' : ''}
              ${!cell && !winner && !isDraw && isPlayerTurn ? 'cursor-pointer' : 'cursor-not-allowed'}
            `}
          >
            {getMarkDisplay(cell)}
          </button>
        ))}
      </div>

      {!isPlayerTurn && !winner && !isDraw && (
        <div className="text-center mt-4 p-4 bg-gray-100 rounded-lg">
          <p className="text-lg">Rakibinizin hamlesini bekleyin...</p>
        </div>
      )}
    </div>
  );
};


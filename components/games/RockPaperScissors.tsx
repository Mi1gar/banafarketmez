'use client';

import React, { useState } from 'react';
import { Button } from '../ui/Button';
import {
  RockPaperScissorsChoice,
  determineRockPaperScissorsWinner,
} from '@/lib/gameLogic';

interface RockPaperScissorsProps {
  player1Name: string;
  player2Name: string;
  currentPlayer: string;
  onMove: (choice: RockPaperScissorsChoice) => void;
  player1Choice: RockPaperScissorsChoice | null;
  player2Choice: RockPaperScissorsChoice | null;
  player1Score: number;
  player2Score: number;
  round: number;
}

export const RockPaperScissors: React.FC<RockPaperScissorsProps> = ({
  player1Name,
  player2Name,
  currentPlayer,
  onMove,
  player1Choice,
  player2Choice,
  player1Score,
  player2Score,
  round,
}) => {
  const choices: { value: RockPaperScissorsChoice; emoji: string; label: string }[] = [
    { value: 'rock', emoji: '🪨', label: 'Taş' },
    { value: 'paper', emoji: '📄', label: 'Kağıt' },
    { value: 'scissors', emoji: '✂️', label: 'Makas' },
  ];

  const isPlayerTurn = currentPlayer === player1Name;
  const bothChose = player1Choice && player2Choice;

  let result: { winner: string | null; message: string } | null = null;
  if (bothChose) {
    const winner = determineRockPaperScissorsWinner(player1Choice!, player2Choice!);
    if (winner === 'player1') {
      result = { winner: player1Name, message: `${player1Name} kazandı!` };
    } else if (winner === 'player2') {
      result = { winner: player2Name, message: `${player2Name} kazandı!` };
    } else {
      result = { winner: null, message: 'Berabere!' };
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold mb-2">Taş Kağıt Makas</h2>
        <p className="text-gray-600">Round {round}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <p className="font-semibold text-lg mb-2">{player1Name}</p>
          <p className="text-2xl mb-2">
            {player1Choice
              ? choices.find((c) => c.value === player1Choice)?.emoji
              : '?'}
          </p>
          <p className="text-sm text-gray-600">Skor: {player1Score}</p>
        </div>
        <div className="text-center p-4 bg-red-50 rounded-lg">
          <p className="font-semibold text-lg mb-2">{player2Name}</p>
          <p className="text-2xl mb-2">
            {player2Choice
              ? choices.find((c) => c.value === player2Choice)?.emoji
              : '?'}
          </p>
          <p className="text-sm text-gray-600">Skor: {player2Score}</p>
        </div>
      </div>

      {result && (
        <div className="text-center mb-6 p-4 bg-yellow-50 rounded-lg">
          <p className="text-xl font-bold text-yellow-800">{result.message}</p>
        </div>
      )}

      {!bothChose && isPlayerTurn && (
        <div className="space-y-4">
          <p className="text-center text-lg font-semibold mb-4">
            Seçiminizi yapın:
          </p>
          <div className="grid grid-cols-3 gap-4">
            {choices.map((choice) => (
              <button
                key={choice.value}
                onClick={() => onMove(choice.value)}
                className="p-6 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-4xl"
                disabled={!isPlayerTurn}
              >
                <div>{choice.emoji}</div>
                <div className="text-sm mt-2">{choice.label}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {!bothChose && !isPlayerTurn && (
        <div className="text-center p-4 bg-gray-100 rounded-lg">
          <p className="text-lg">Rakibinizin seçimini bekleyin...</p>
        </div>
      )}
    </div>
  );
};




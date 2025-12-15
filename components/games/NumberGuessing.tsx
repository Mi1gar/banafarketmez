'use client';

import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { NumberGuessingState } from '@/lib/gameLogic';

interface NumberGuessingProps {
  player1Name: string;
  player2Name: string;
  currentPlayer: string;
  gameState: NumberGuessingState;
  isNumberSetter: boolean;
  onSetNumber: (number: number) => void;
  onGuess: (guess: number) => void;
}

export const NumberGuessing: React.FC<NumberGuessingProps> = ({
  player1Name,
  player2Name,
  currentPlayer,
  gameState,
  isNumberSetter,
  onSetNumber,
  onGuess,
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(inputValue);
    if (isNaN(num)) return;

    if (isNumberSetter && !gameState.targetNumber) {
      if (num >= gameState.minRange && num <= gameState.maxRange) {
        onSetNumber(num);
        setInputValue('');
      }
    } else if (!isNumberSetter && gameState.targetNumber) {
      if (num >= gameState.minRange && num <= gameState.maxRange) {
        onGuess(num);
        setInputValue('');
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold mb-2">Sayı Tahmin Oyunu</h2>
        <p className="text-gray-600">
          Aralık: {gameState.minRange} - {gameState.maxRange}
        </p>
      </div>

      {isNumberSetter && !gameState.targetNumber && (
        <div className="text-center mb-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-lg font-semibold mb-4">
            {currentPlayer}, bir sayı seçin ({gameState.minRange} - {gameState.maxRange})
          </p>
          <form onSubmit={handleSubmit} className="flex gap-2 justify-center">
            <input
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              min={gameState.minRange}
              max={gameState.maxRange}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Sayı girin"
            />
            <Button type="submit" variant="primary">
              Seç
            </Button>
          </form>
        </div>
      )}

      {!isNumberSetter && gameState.targetNumber && (
        <div className="space-y-4">
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <p className="text-lg font-semibold mb-2">
              {currentPlayer}, sayıyı tahmin edin!
            </p>
            <p className="text-sm text-gray-600">
              Deneme sayısı: {gameState.guesses.length}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              min={gameState.minRange}
              max={gameState.maxRange}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Tahmininizi girin"
              disabled={gameState.isGameOver}
            />
            <Button
              type="submit"
              variant="primary"
              disabled={gameState.isGameOver}
            >
              Tahmin Et
            </Button>
          </form>

          {gameState.hints.length > 0 && (
            <div className="space-y-2">
              <p className="font-semibold">İpuçları:</p>
              <div className="bg-gray-50 rounded-lg p-4 space-y-1">
                {gameState.hints.map((hint, index) => (
                  <p key={index} className="text-sm">
                    {gameState.guesses[index]}: {hint}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {gameState.isGameOver && (
        <div className="text-center mt-6 p-4 bg-green-50 rounded-lg">
          <p className="text-xl font-bold text-green-800">
            {gameState.winner} kazandı! 🎉
          </p>
          <p className="text-sm text-gray-600 mt-2">
            {gameState.guesses.length} denemede bulundu!
          </p>
        </div>
      )}
    </div>
  );
};


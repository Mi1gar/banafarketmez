'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { RockPaperScissors } from '@/components/games/RockPaperScissors';
import { TicTacToe } from '@/components/games/TicTacToe';
import { NumberGuessing } from '@/components/games/NumberGuessing';
import { useUser } from '@/lib/userContext';
import { getSocket } from '@/lib/socket';
import { RockPaperScissorsChoice } from '@/lib/gameLogic';
import { TicTacToeBoard, createEmptyBoard, checkTicTacToeWinner } from '@/lib/gameLogic';
import { NumberGuessingState } from '@/lib/gameLogic';

export default function PlayPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { username } = useUser();
  const gameType = params.gameType as string;
  const lobbyId = searchParams.get('lobbyId');

  const [gameState, setGameState] = useState<any>(null);
  const [currentPlayer, setCurrentPlayer] = useState<string>('');

  useEffect(() => {
    if (!username || !lobbyId) {
      router.push('/');
      return;
    }

    const socket = getSocket();

    // Oyun state'ini başlat
    if (gameType === 'rock-paper-scissors') {
      setGameState({
        player1Choice: null,
        player2Choice: null,
        player1Score: 0,
        player2Score: 0,
        round: 1,
      });
    } else if (gameType === 'tic-tac-toe') {
      setGameState({
        board: createEmptyBoard(),
        player1Mark: 'X',
        player2Mark: 'O',
        winner: null,
        winningLine: null,
        isDraw: false,
      });
    } else if (gameType === 'number-guessing') {
      setGameState({
        targetNumber: null,
        minRange: 1,
        maxRange: 100,
        guesses: [],
        hints: [],
        isGameOver: false,
        winner: null,
      });
    }

    // Socket event listeners
    socket.on('game:move', (data: any) => {
      setGameState((prev: any) => {
        // Oyun state'ini güncelle
        return { ...prev, ...data.move };
      });
    });

    socket.on('game:ended', (data: any) => {
      // Oyun bitti
      if (gameType === 'rock-paper-scissors') {
        setGameState((prev: any) => ({
          ...prev,
          ...data.result,
        }));
      }
    });

    return () => {
      socket.off('game:move');
      socket.off('game:ended');
    };
  }, [gameType, lobbyId, username, router]);

  const handleMove = (move: any) => {
    if (!lobbyId) return;

    const socket = getSocket();
    socket.emit('game:move', {
      lobbyId,
      move,
    });
  };

  if (!username || !lobbyId || !gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4">
        {gameType === 'rock-paper-scissors' && (
          <RockPaperScissors
            player1Name={gameState.player1Name || 'Oyuncu 1'}
            player2Name={gameState.player2Name || 'Oyuncu 2'}
            currentPlayer={currentPlayer || username}
            onMove={(choice: RockPaperScissorsChoice) => handleMove({ choice })}
            player1Choice={gameState.player1Choice}
            player2Choice={gameState.player2Choice}
            player1Score={gameState.player1Score}
            player2Score={gameState.player2Score}
            round={gameState.round}
          />
        )}

        {gameType === 'tic-tac-toe' && (
          <TicTacToe
            board={gameState.board}
            currentPlayer={currentPlayer || username}
            player1Name={gameState.player1Name || 'Oyuncu 1'}
            player2Name={gameState.player2Name || 'Oyuncu 2'}
            player1Mark={gameState.player1Mark}
            player2Mark={gameState.player2Mark}
            winner={gameState.winner}
            winningLine={gameState.winningLine}
            isDraw={gameState.isDraw}
            onMove={(index: number) => handleMove({ index })}
          />
        )}

        {gameType === 'number-guessing' && (
          <NumberGuessing
            player1Name={gameState.player1Name || 'Oyuncu 1'}
            player2Name={gameState.player2Name || 'Oyuncu 2'}
            currentPlayer={currentPlayer || username}
            gameState={gameState as NumberGuessingState}
            isNumberSetter={gameState.isNumberSetter || false}
            onSetNumber={(number: number) => handleMove({ targetNumber: number })}
            onGuess={(guess: number) => handleMove({ guess })}
          />
        )}
      </div>
    </div>
  );
}


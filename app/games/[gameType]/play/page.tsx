'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { RockPaperScissors } from '@/components/games/RockPaperScissors';
import { TicTacToe } from '@/components/games/TicTacToe';
import { NumberGuessing } from '@/components/games/NumberGuessing';
import { useUser } from '@/lib/userContext';
import { getSocket } from '@/lib/socket';
import { 
  RockPaperScissorsChoice, 
  determineRockPaperScissorsWinner,
  TicTacToeBoard, 
  createEmptyBoard, 
  checkTicTacToeWinner,
  NumberGuessingState, 
  generateHint 
} from '@/lib/gameLogic';
import { Button } from '@/components/ui/Button';

interface GameState {
  // Common
  player1Name: string;
  player2Name: string;
  isGameOver: boolean;
  winner: string | null;
  
  // Rock Paper Scissors
  player1Choice?: RockPaperScissorsChoice | null;
  player2Choice?: RockPaperScissorsChoice | null;
  player1Score?: number;
  player2Score?: number;
  round?: number;
  currentRound?: number;
  maxRounds?: number;
  waitingForChoices?: boolean;
  
  // Tic Tac Toe
  board?: TicTacToeBoard;
  player1Mark?: 'X' | 'O';
  player2Mark?: 'X' | 'O';
  currentPlayer?: string;
  winningLine?: number[] | null;
  isDraw?: boolean;
  
  // Number Guessing
  numberSetter?: string;
  guesser?: string;
  targetNumber?: number | null;
  minRange?: number;
  maxRange?: number;
  guesses?: number[];
  hints?: string[];
}

export default function PlayPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { username } = useUser();
  const gameType = params.gameType as string;
  const lobbyId = searchParams.get('lobbyId');

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [lobbyInfo, setLobbyInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Lobi bilgilerini al
  const fetchLobbyInfo = useCallback(async () => {
    if (!lobbyId) return;
    
    try {
      const response = await fetch(`/api/lobbies/${lobbyId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.lobby) {
          setLobbyInfo(data.lobby);
          return data.lobby;
        }
      }
    } catch (error) {
      console.error('Error fetching lobby info:', error);
    }
    return null;
  }, [lobbyId]);

  // Oyun state'ini başlat
  const initializeGameState = useCallback((lobby: any) => {
    if (!lobby || !lobby.players || lobby.players.length < 2) {
      console.error('Invalid lobby for game start');
      return;
    }

    const player1Name = lobby.players[0];
    const player2Name = lobby.players[1];
    const isPlayer1 = username === player1Name;

    if (gameType === 'rock-paper-scissors') {
      setGameState({
        player1Name,
        player2Name,
        player1Choice: null,
        player2Choice: null,
        player1Score: 0,
        player2Score: 0,
        round: 1,
        currentRound: 1,
        maxRounds: 5,
        waitingForChoices: true,
        isGameOver: false,
        winner: null,
      });
    } else if (gameType === 'tic-tac-toe') {
      setGameState({
        player1Name,
        player2Name,
        player1Mark: 'X',
        player2Mark: 'O',
        board: createEmptyBoard(),
        currentPlayer: player1Name, // X başlar
        winner: null,
        winningLine: null,
        isDraw: false,
        isGameOver: false,
      });
    } else if (gameType === 'number-guessing') {
      // İlk oyuncu sayı seçer, ikinci tahmin eder
      setGameState({
        player1Name,
        player2Name,
        numberSetter: player1Name,
        guesser: player2Name,
        targetNumber: null,
        minRange: 1,
        maxRange: 100,
        guesses: [],
        hints: [],
        isGameOver: false,
        winner: null,
      });
    }
  }, [gameType, username]);

  useEffect(() => {
    if (!username || !lobbyId) {
      router.push('/');
      return;
    }

    const socket = getSocket();
    let isMounted = true;

    // İlk yükleme - lobi bilgilerini al
    const init = async () => {
      const lobby = await fetchLobbyInfo();
      if (lobby && isMounted) {
        initializeGameState(lobby);
        setIsLoading(false);
      }
    };

    init();

    // Socket event listeners
    const handleGameStarted = (data: any) => {
      if (!isMounted) return;
      console.log('PlayPage: game:started event received:', data);
      if (data.lobby) {
        setLobbyInfo(data.lobby);
        initializeGameState(data.lobby);
        setIsLoading(false);
      }
    };

    const handleGameMove = (data: any) => {
      if (!isMounted) return;
      console.log('PlayPage: game:move event received:', data);
      
      setGameState((prev) => {
        if (!prev) return prev;
        
        // Oyun tipine göre state güncelle
        if (gameType === 'rock-paper-scissors') {
          return handleRockPaperScissorsMove(prev, data.move, username);
        } else if (gameType === 'tic-tac-toe') {
          return handleTicTacToeMove(prev, data.move, username);
        } else if (gameType === 'number-guessing') {
          return handleNumberGuessingMove(prev, data.move, username);
        }
        return prev;
      });
    };

    const handleGameEnded = (data: any) => {
      if (!isMounted) return;
      console.log('PlayPage: game:ended event received:', data);
      setGameState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          isGameOver: true,
          winner: data.winner || null,
        };
      });
    };

    socket.on('game:started', handleGameStarted);
    socket.on('game:move', handleGameMove);
    socket.on('game:ended', handleGameEnded);

    return () => {
      isMounted = false;
      socket.off('game:started', handleGameStarted);
      socket.off('game:move', handleGameMove);
      socket.off('game:ended', handleGameEnded);
    };
  }, [gameType, lobbyId, username, router, fetchLobbyInfo, initializeGameState]);

  // Taş Kağıt Makas hamle işleme
  const handleRockPaperScissorsMove = (prev: GameState, move: any, currentUser: string): GameState => {
    if (move.choice) {
      const isPlayer1 = currentUser === prev.player1Name;
      const isPlayer2 = currentUser === prev.player2Name;
      
      if (isPlayer1) {
        prev.player1Choice = move.choice;
      } else if (isPlayer2) {
        prev.player2Choice = move.choice;
      }

      // Her iki seçim de yapıldıysa round'u bitir
      if (prev.player1Choice && prev.player2Choice) {
        const winner = determineRockPaperScissorsWinner(
          prev.player1Choice,
          prev.player2Choice
        );
        
        if (winner === 'player1') {
          prev.player1Score = (prev.player1Score || 0) + 1;
        } else if (winner === 'player2') {
          prev.player2Score = (prev.player2Score || 0) + 1;
        }

        // Yeni round başlat
        prev.currentRound = (prev.currentRound || 1) + 1;
        prev.player1Choice = null;
        prev.player2Choice = null;
        prev.waitingForChoices = true;

        // Oyun bitti mi kontrol et
        if (prev.currentRound > (prev.maxRounds || 5)) {
          prev.isGameOver = true;
          if ((prev.player1Score || 0) > (prev.player2Score || 0)) {
            prev.winner = prev.player1Name;
          } else if ((prev.player2Score || 0) > (prev.player1Score || 0)) {
            prev.winner = prev.player2Name;
          } else {
            prev.winner = 'draw';
          }
        }
      }
    }
    return { ...prev };
  };

  // Tic Tac Toe hamle işleme
  const handleTicTacToeMove = (prev: GameState, move: any, currentUser: string): GameState => {
    if (move.index !== undefined && prev.board && prev.currentPlayer === currentUser) {
      const isPlayer1 = currentUser === prev.player1Name;
      const mark = isPlayer1 ? prev.player1Mark : prev.player2Mark;
      
      if (mark && !prev.board[move.index]) {
        const newBoard = [...prev.board];
        newBoard[move.index] = mark;
        
        const result = checkTicTacToeWinner(newBoard);
        const isGameOver = result.winner !== null || result.isDraw;
        
        if (isGameOver) {
          // Oyun bitti event'i gönder
          const socket = getSocket();
          socket.emit('game:end', {
            lobbyId,
            winner: result.winner ? (result.winner === prev.player1Mark ? prev.player1Name : prev.player2Name) : 'draw',
          });
        }
        
        return {
          ...prev,
          board: newBoard,
          currentPlayer: prev.currentPlayer === prev.player1Name ? prev.player2Name : prev.player1Name,
          winner: result.winner,
          winningLine: result.winningLine,
          isDraw: result.isDraw,
          isGameOver,
        };
      }
    }
    return prev;
  };

  // Sayı Tahmin hamle işleme
  const handleNumberGuessingMove = (prev: GameState, move: any, currentUser: string): GameState => {
    if (move.targetNumber !== undefined && currentUser === prev.numberSetter) {
      return {
        ...prev,
        targetNumber: move.targetNumber,
      };
    } else if (move.guess !== undefined && currentUser === prev.guesser) {
      const guess = move.guess;
      const target = prev.targetNumber;
      
      if (target !== null) {
        const newGuesses = [...(prev.guesses || []), guess];
        const newHints = [...(prev.hints || [])];
        
        if (guess === target) {
          // Doğru tahmin!
          newHints.push('Doğru!');
          const winner = prev.guesser || null;
          
          // Oyun bitti event'i gönder
          const socket = getSocket();
          socket.emit('game:end', {
            lobbyId,
            winner,
          });
          
          return {
            ...prev,
            guesses: newGuesses,
            hints: newHints,
            isGameOver: true,
            winner,
          };
        } else {
          // İpucu oluştur
          const hint = generateHint(guess, target, prev.minRange || 1, prev.maxRange || 100);
          newHints.push(hint);
          return {
            ...prev,
            guesses: newGuesses,
            hints: newHints,
          };
        }
      }
    }
    return prev;
  };

  const handleMove = (move: any) => {
    if (!lobbyId) return;

    const socket = getSocket();
    socket.emit('game:move', {
      lobbyId,
      move,
      player: username,
    });
  };

  const handleBackToLobby = () => {
    router.push(`/games/${gameType}`);
  };

  if (!username || !lobbyId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Yükleniyor...</p>
      </div>
    );
  }

  if (isLoading || !gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4">Oyun başlatılıyor...</p>
          <p className="text-gray-600">Lütfen bekleyin</p>
        </div>
      </div>
    );
  }

  // Oyun bitişi ekranı
  if (gameState.isGameOver) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <h2 className="text-4xl font-bold mb-4">Oyun Bitti!</h2>
            {gameState.winner === 'draw' ? (
              <p className="text-2xl text-yellow-600 mb-6">Berabere!</p>
            ) : gameState.winner === username ? (
              <p className="text-2xl text-green-600 mb-6">🎉 Kazandınız! 🎉</p>
            ) : (
              <p className="text-2xl text-red-600 mb-6">Kaybettiniz 😔</p>
            )}
            
            {gameType === 'rock-paper-scissors' && (
              <div className="mb-6">
                <p className="text-lg mb-2">
                  {gameState.player1Name}: {gameState.player1Score || 0}
                </p>
                <p className="text-lg mb-2">
                  {gameState.player2Name}: {gameState.player2Score || 0}
                </p>
              </div>
            )}
            
            <div className="flex gap-4 justify-center">
              <Button variant="primary" onClick={handleBackToLobby}>
                Lobiye Dön
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-4">
          <Button variant="outline" onClick={handleBackToLobby}>
            ← Lobiye Dön
          </Button>
        </div>

        {gameType === 'rock-paper-scissors' && (
          <RockPaperScissors
            player1Name={gameState.player1Name}
            player2Name={gameState.player2Name}
            currentPlayer={username}
            onMove={(choice: RockPaperScissorsChoice) => {
              handleMove({ choice, player: username });
            }}
            player1Choice={gameState.player1Choice || null}
            player2Choice={gameState.player2Choice || null}
            player1Score={gameState.player1Score || 0}
            player2Score={gameState.player2Score || 0}
            round={gameState.currentRound || 1}
          />
        )}

        {gameType === 'tic-tac-toe' && gameState.board && (
          <TicTacToe
            board={gameState.board}
            currentPlayer={gameState.currentPlayer || gameState.player1Name}
            player1Name={gameState.player1Name}
            player2Name={gameState.player2Name}
            player1Mark={gameState.player1Mark || 'X'}
            player2Mark={gameState.player2Mark || 'O'}
            winner={gameState.winner as any}
            winningLine={gameState.winningLine || null}
            isDraw={gameState.isDraw || false}
            onMove={(index: number) => {
              handleMove({ index, player: username });
            }}
          />
        )}

        {gameType === 'number-guessing' && (
          <NumberGuessing
            player1Name={gameState.player1Name}
            player2Name={gameState.player2Name}
            currentPlayer={username}
            gameState={{
              targetNumber: gameState.targetNumber || null,
              minRange: gameState.minRange || 1,
              maxRange: gameState.maxRange || 100,
              guesses: gameState.guesses || [],
              hints: gameState.hints || [],
              isGameOver: gameState.isGameOver || false,
              winner: gameState.winner || null,
            }}
            isNumberSetter={gameState.numberSetter === username}
            onSetNumber={(number: number) => {
              handleMove({ targetNumber: number, player: username });
            }}
            onGuess={(guess: number) => {
              handleMove({ guess, player: username });
            }}
          />
        )}
      </div>
    </div>
  );
}

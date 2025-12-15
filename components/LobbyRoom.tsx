'use client';

import React from 'react';
import { Button } from './ui/Button';
import { Lobby, GameType } from '@/lib/lobbyManager';

interface LobbyRoomProps {
  lobby: Lobby;
  currentUsername: string;
  onLeave: () => void;
  onStartGame: () => void;
}

export const LobbyRoom: React.FC<LobbyRoomProps> = ({
  lobby,
  currentUsername,
  onLeave,
  onStartGame,
}) => {
  const gameNames: Record<GameType, string> = {
    'rock-paper-scissors': 'Taş Kağıt Makas',
    'tic-tac-toe': 'Tic Tac Toe',
    'number-guessing': 'Sayı Tahmin Oyunu',
  };

  const isHost = lobby.host === currentUsername;
  const isFull = lobby.players.length >= lobby.maxPlayers;
  const canStart = isHost && isFull && lobby.status === 'full';

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold mb-2">Lobi Odası</h2>
        <p className="text-gray-600">{gameNames[lobby.gameType]}</p>
        <p className="text-sm text-gray-500 mt-1">Lobi ID: #{lobby.id}</p>
      </div>

      <div className="space-y-4 mb-6">
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="font-semibold mb-2">Oyuncular:</p>
          <div className="space-y-2">
            {lobby.players.map((player, index) => (
              <div
                key={index}
                className={`p-2 rounded ${
                  player === lobby.host
                    ? 'bg-blue-100 border border-blue-300'
                    : 'bg-white border border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{player}</span>
                  {player === lobby.host && (
                    <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded">
                      Host
                    </span>
                  )}
                  {player === currentUsername && (
                    <span className="text-xs bg-green-500 text-white px-2 py-1 rounded">
                      Siz
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {!isFull && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-center text-yellow-800">
              Diğer oyuncunun katılmasını bekliyorsunuz...
            </p>
          </div>
        )}

        {isFull && !canStart && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-center text-green-800">
              Lobi dolu! Host oyunu başlatacak...
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        {canStart && (
          <Button variant="primary" onClick={onStartGame} className="flex-1">
            Oyunu Başlat
          </Button>
        )}
        <Button variant="outline" onClick={onLeave} className="flex-1">
          Lobiden Ayrıl
        </Button>
      </div>
    </div>
  );
};




'use client';

import React from 'react';
import { Button } from './ui/Button';
import { Lobby, GameType } from '@/lib/lobbyManager';

interface LobbyListProps {
  lobbies: Lobby[];
  gameType: GameType;
  currentUsername: string;
  onJoin: (lobbyId: string) => void;
  onCreate: () => void;
}

export const LobbyList: React.FC<LobbyListProps> = ({
  lobbies,
  gameType,
  currentUsername,
  onJoin,
  onCreate,
}) => {
  const gameNames: Record<GameType, string> = {
    'rock-paper-scissors': 'Taş Kağıt Makas',
    'tic-tac-toe': 'Tic Tac Toe',
    'number-guessing': 'Sayı Tahmin Oyunu',
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Az önce';
    if (minutes < 60) return `${minutes} dakika önce`;
    const hours = Math.floor(minutes / 60);
    return `${hours} saat önce`;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">
          {gameNames[gameType]} - Aktif Lobilere
        </h2>
        <Button variant="primary" onClick={onCreate}>
          Yeni Lobi Oluştur
        </Button>
      </div>

      {lobbies.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">Henüz aktif lobi yok.</p>
          <Button variant="primary" onClick={onCreate}>
            İlk Lobiyi Oluştur
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {lobbies.map((lobby) => {
            const canJoin =
              lobby.status === 'waiting' &&
              !lobby.players.includes(currentUsername) &&
              lobby.players.length < lobby.maxPlayers;

            return (
              <div
                key={lobby.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm text-gray-500">
                      #{lobby.id}
                    </span>
                    <span className="text-sm text-gray-600">
                      Host: {lobby.host}
                    </span>
                    <span className="text-sm text-gray-500">
                      {formatTime(lobby.createdAt)}
                    </span>
                  </div>
                  <div className="mt-1">
                    <span className="text-sm text-gray-600">
                      Oyuncular: {lobby.players.length}/{lobby.maxPlayers}
                    </span>
                    {lobby.status === 'full' && (
                      <span className="ml-2 text-sm text-yellow-600 font-semibold">
                        Dolu
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  {canJoin ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => onJoin(lobby.id)}
                    >
                      Katıl
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" disabled>
                      {lobby.players.includes(currentUsername)
                        ? 'Zaten Katıldınız'
                        : 'Dolu'}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};




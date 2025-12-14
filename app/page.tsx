'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GameCard } from '@/components/GameCard';
import { UsernameModal } from '@/components/UsernameModal';
import { useUser } from '@/lib/userContext';

export default function Home() {
  const { username } = useUser();
  const router = useRouter();
  const [selectedGame, setSelectedGame] = useState<string | null>(null);

  const games = [
    {
      id: 'rock-paper-scissors',
      title: 'Taş Kağıt Makas',
      description: 'Klasik taş kağıt makas oyunu. Rakibinizi yenmeye çalışın!',
      icon: '✂️',
    },
    {
      id: 'tic-tac-toe',
      title: 'Tic Tac Toe',
      description: '3x3 grid üzerinde X ve O ile oynanan strateji oyunu.',
      icon: '⭕',
    },
    {
      id: 'number-guessing',
      title: 'Sayı Tahmin Oyunu',
      description: 'Rakibinizin seçtiği sayıyı tahmin etmeye çalışın!',
      icon: '🔢',
    },
  ];

  const handleCreateLobby = (gameId: string) => {
    router.push(`/games/${gameId}`);
  };

  const handleJoinLobby = (gameId: string) => {
    router.push(`/games/${gameId}`);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <UsernameModal />
      
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Banafarketmez
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Online Multiplayer Oyun Platformu
          </p>
          {username && (
            <p className="text-sm text-gray-500">
              Hoş geldin, <span className="font-semibold">{username}</span>!
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {games.map((game) => (
            <GameCard
              key={game.id}
              title={game.title}
              description={game.description}
              icon={game.icon}
              onPlay={() => {}}
              onCreateLobby={() => handleCreateLobby(game.id)}
              onJoinLobby={() => handleJoinLobby(game.id)}
            />
          ))}
        </div>
      </div>
    </main>
  );
}

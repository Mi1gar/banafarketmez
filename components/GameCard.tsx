'use client';

import React from 'react';
import { Button } from './ui/Button';

interface GameCardProps {
  title: string;
  description: string;
  icon: string;
  onPlay: () => void;
  onCreateLobby?: () => void;
  onJoinLobby?: () => void;
}

export const GameCard: React.FC<GameCardProps> = ({
  title,
  description,
  icon,
  onPlay,
  onCreateLobby,
  onJoinLobby,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border border-gray-200">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-2 text-gray-900">{title}</h3>
      <p className="text-gray-600 mb-4">{description}</p>
      <div className="flex flex-col gap-2">
        {onCreateLobby && (
          <Button onClick={onCreateLobby} variant="primary" className="w-full">
            Lobi Oluştur
          </Button>
        )}
        {onJoinLobby && (
          <Button onClick={onJoinLobby} variant="secondary" className="w-full">
            Lobilere Katıl
          </Button>
        )}
        {!onCreateLobby && !onJoinLobby && (
          <Button onClick={onPlay} variant="primary" className="w-full">
            Oyna
          </Button>
        )}
      </div>
    </div>
  );
};




'use client';

import React, { useState } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { GameType } from '@/lib/lobbyManager';

interface CreateLobbyProps {
  isOpen: boolean;
  onClose: () => void;
  gameType: GameType;
  onCreate: (gameType: GameType) => void;
}

export const CreateLobby: React.FC<CreateLobbyProps> = ({
  isOpen,
  onClose,
  gameType,
  onCreate,
}) => {
  const gameNames: Record<GameType, string> = {
    'rock-paper-scissors': 'Taş Kağıt Makas',
    'tic-tac-toe': 'Tic Tac Toe',
    'number-guessing': 'Sayı Tahmin Oyunu',
  };

  const handleCreate = () => {
    onCreate(gameType);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Lobi Oluştur"
      size="sm"
    >
      <div className="space-y-4">
        <p className="text-gray-600">
          <span className="font-semibold">{gameNames[gameType]}</span> için yeni bir lobi oluşturmak istiyor musunuz?
        </p>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>
            İptal
          </Button>
          <Button variant="primary" onClick={handleCreate}>
            Oluştur
          </Button>
        </div>
      </div>
    </Modal>
  );
};


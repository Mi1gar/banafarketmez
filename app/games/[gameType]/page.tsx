'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { LobbyList } from '@/components/LobbyList';
import { CreateLobby } from '@/components/CreateLobby';
import { LobbyRoom } from '@/components/LobbyRoom';
import { useUser } from '@/lib/userContext';
import { getSocket } from '@/lib/socket';
import { Lobby, GameType } from '@/lib/lobbyManager';

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const { username } = useUser();
  const gameType = params.gameType as GameType;

  const [lobbies, setLobbies] = useState<Lobby[]>([]);
  const [currentLobby, setCurrentLobby] = useState<Lobby | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [view, setView] = useState<'list' | 'room'>('list');

  useEffect(() => {
    if (!username) {
      router.push('/');
      return;
    }

    const socket = getSocket();

    // Lobi listesini al
    const fetchLobbies = async () => {
      try {
        const response = await fetch(`/api/lobbies?gameType=${gameType}`);
        const data = await response.json();
        setLobbies(data.lobbies || []);
      } catch (error) {
        console.error('Error fetching lobbies:', error);
      }
    };

    // İlk yükleme
    fetchLobbies();

    // Socket bağlantısı kurulduğunda
    socket.on('connect', () => {
      console.log('Socket connected');
      fetchLobbies();
    });

    // Socket bağlantı hatası
    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    // Socket event listeners
    socket.on('lobby:list', (lobbiesList: Lobby[]) => {
      setLobbies(lobbiesList);
    });

    socket.on('lobby:list-updated', () => {
      console.log('Lobby list updated');
      fetchLobbies();
    });

    socket.on('lobby:created', (lobby: Lobby) => {
      console.log('Lobby created:', lobby);
      setCurrentLobby(lobby);
      setView('room');
      fetchLobbies();
    });

    socket.on('lobby:updated', (lobby: Lobby) => {
      console.log('Lobby updated:', lobby);
      if (currentLobby && lobby.id === currentLobby.id) {
        setCurrentLobby(lobby);
      }
      fetchLobbies();
    });

    socket.on('game:started', (lobby: Lobby) => {
      setCurrentLobby(lobby);
      // Oyun sayfasına yönlendir
      router.push(`/games/${gameType}/play?lobbyId=${lobby.id}`);
    });

    socket.on('error', (error: any) => {
      console.error('Socket error:', error);
    });

    // Periyodik olarak lobi listesini yenile (fallback)
    const interval = setInterval(() => {
      fetchLobbies();
    }, 5000); // 5 saniyede bir

    return () => {
      clearInterval(interval);
      socket.off('connect');
      socket.off('connect_error');
      socket.off('lobby:list');
      socket.off('lobby:list-updated');
      socket.off('lobby:created');
      socket.off('lobby:updated');
      socket.off('game:started');
      socket.off('error');
    };
  }, [gameType, username, router]);

  const handleCreateLobby = async (selectedGameType: GameType) => {
    if (!username) return;

    try {
      // Önce API route ile lobi oluştur (daha güvenilir)
      const response = await fetch('/api/lobbies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameType: selectedGameType,
          host: username,
        }),
      });

      const data = await response.json();
      
      if (response.ok && data.lobby) {
        console.log('Lobby created via API:', data.lobby);
        setCurrentLobby(data.lobby);
        setView('room');
        
        // Socket.io'ya da bildir
        const socket = getSocket();
        socket.emit('lobby:create', {
          gameType: selectedGameType,
          host: username,
        });
        
        // Lobi listesini yenile
        fetchLobbies();
      } else {
        console.error('Failed to create lobby:', data);
        alert('Lobi oluşturulamadı: ' + (data.error || 'Bilinmeyen hata'));
      }
    } catch (error) {
      console.error('Error creating lobby:', error);
      // Fallback: Sadece Socket.io ile dene
      const socket = getSocket();
      socket.emit('lobby:create', {
        gameType: selectedGameType,
        host: username,
      });
    }
  };

  const handleJoinLobby = async (lobbyId: string) => {
    if (!username) return;

    const socket = getSocket();
    socket.emit('lobby:join', {
      lobbyId,
      player: username,
    });

    // Lobi bilgisini al
    try {
      const response = await fetch(`/api/lobbies/${lobbyId}`);
      const data = await response.json();
      if (data.lobby) {
        setCurrentLobby(data.lobby);
        setView('room');
      }
    } catch (error) {
      console.error('Error joining lobby:', error);
    }
  };

  const handleLeaveLobby = () => {
    if (!currentLobby || !username) return;

    const socket = getSocket();
    socket.emit('lobby:leave', {
      lobbyId: currentLobby.id,
      player: username,
    });

    setCurrentLobby(null);
    setView('list');
  };

  const handleStartGame = () => {
    if (!currentLobby) return;

    const socket = getSocket();
    socket.emit('lobby:start', {
      lobbyId: currentLobby.id,
    });
  };

  if (!username) {
    return null;
  }

  if (view === 'room' && currentLobby) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="container mx-auto px-4">
          <button
            onClick={() => {
              setView('list');
              setCurrentLobby(null);
            }}
            className="mb-4 text-blue-600 hover:text-blue-800"
          >
            ← Geri Dön
          </button>
          <LobbyRoom
            lobby={currentLobby}
            currentUsername={username}
            onLeave={handleLeaveLobby}
            onStartGame={handleStartGame}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4">
        <button
          onClick={() => router.push('/')}
          className="mb-4 text-blue-600 hover:text-blue-800"
        >
          ← Ana Sayfaya Dön
        </button>
        <LobbyList
          lobbies={lobbies}
          gameType={gameType}
          currentUsername={username}
          onJoin={handleJoinLobby}
          onCreate={() => setShowCreateModal(true)}
        />
        <CreateLobby
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          gameType={gameType}
          onCreate={handleCreateLobby}
        />
      </div>
    </div>
  );
}


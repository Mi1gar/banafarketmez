'use client';

import React, { useState, useEffect, useCallback } from 'react';
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

  // Lobi listesini al
  const fetchLobbies = useCallback(async () => {
    try {
      const response = await fetch(`/api/lobbies?gameType=${gameType}`);
      const data = await response.json();
      setLobbies(data.lobbies || []);
    } catch (error) {
      console.error('Error fetching lobbies:', error);
    }
  }, [gameType]);

  useEffect(() => {
    if (!username) {
      router.push('/');
      return;
    }

    const socket = getSocket();
    let isMounted = true;

    // İlk yükleme
    fetchLobbies();

    // Socket bağlantısı kurulduğunda
    const handleConnect = () => {
      if (!isMounted) return;
      console.log('Socket connected');
      fetchLobbies();
    };

    // Socket bağlantı hatası
    const handleConnectError = (error: Error) => {
      if (!isMounted) return;
      console.error('Socket connection error:', error);
    };

    // Socket event listeners
    const handleLobbyList = (lobbiesList: Lobby[]) => {
      if (!isMounted) return;
      setLobbies(lobbiesList);
    };

    const handleLobbyListUpdated = () => {
      if (!isMounted) return;
      console.log('Lobby list updated');
      fetchLobbies();
    };

    const handleLobbyCreated = (lobby: Lobby) => {
      if (!isMounted) return;
      console.log('Lobby created:', lobby);
      setCurrentLobby(lobby);
      setView('room');
      fetchLobbies();
    };

    const handleLobbyUpdated = (lobby: Lobby) => {
      if (!isMounted) return;
      console.log('GamePage: Lobby updated via socket:', lobby);
      // State'i güncelle (closure problemi önlemek için functional update kullan)
      setCurrentLobby((prev) => {
        if (prev && prev.id === lobby.id) {
          console.log('GamePage: Updating current lobby state:', lobby);
          console.log('GamePage: Players in updated lobby:', lobby.players);
          return lobby;
        }
        return prev;
      });
      // Lobi listesini de güncelle
      fetchLobbies();
    };

    const handleLobbyClosed = (data: { lobbyId: string }) => {
      if (!isMounted) return;
      console.log('Lobby closed:', data.lobbyId);
      // State'i güncelle (closure problemi önlemek için functional update kullan)
      setCurrentLobby((prev) => {
        if (prev && prev.id === data.lobbyId) {
          setView('list');
          alert('Lobi kapandı (tüm oyuncular ayrıldı)');
          return null;
        }
        return prev;
      });
      fetchLobbies();
    };

    const handleGameStarted = (data: { lobby: Lobby; gameType: string; players: string[]; player1Name: string; player2Name: string }) => {
      if (!isMounted) return;
      console.log('GamePage: game:started event received:', data);
      setCurrentLobby(data.lobby);
      // Oyun sayfasına yönlendir (lobi bilgileri ile)
      router.push(`/games/${data.gameType}/play?lobbyId=${data.lobby.id}`);
    };

    const handleError = (error: any) => {
      if (!isMounted) return;
      console.error('Socket error:', error);
    };

    const handleDisconnect = () => {
      if (!isMounted) return;
      console.log('Socket disconnected');
    };

    // Event listener'ları ekle
    socket.on('connect', handleConnect);
    socket.on('connect_error', handleConnectError);
    socket.on('disconnect', handleDisconnect);
    socket.on('lobby:list', handleLobbyList);
    socket.on('lobby:list-updated', handleLobbyListUpdated);
    socket.on('lobby:created', handleLobbyCreated);
    socket.on('lobby:updated', handleLobbyUpdated);
    socket.on('lobby:closed', handleLobbyClosed);
    socket.on('game:started', handleGameStarted);
    socket.on('error', handleError);

    // Periyodik olarak lobi listesini yenile (sadece Socket.io bağlı değilse)
    // Socket.io bağlıysa gerçek zamanlı güncellemeler kullanılır
    let interval: NodeJS.Timeout | null = null;
    const checkConnection = () => {
      if (!isMounted) return;
      if (!socket.connected) {
        // Socket bağlı değilse polling yap
        if (!interval) {
          interval = setInterval(() => {
            if (!isMounted || socket.connected) {
              if (interval) {
                clearInterval(interval);
                interval = null;
              }
              return;
            }
            fetchLobbies();
          }, 10000); // 10 saniyede bir (daha az sıklıkta)
        }
      } else {
        // Socket bağlıysa polling'i durdur
        if (interval) {
          clearInterval(interval);
          interval = null;
        }
      }
    };

    // İlk kontrol
    checkConnection();
    
    // Socket bağlantı durumu değiştiğinde kontrol et
    const handleConnectionChange = () => {
      if (!isMounted) return;
      checkConnection();
    };
    
    socket.on('connect', handleConnectionChange);
    socket.on('disconnect', handleConnectionChange);

    // Browser close/refresh durumunda lobi'den ayrıl
    const handleBeforeUnload = () => {
      if (currentLobby && username) {
        // Sync request (blocking) - sadece kritik durumlarda
        navigator.sendBeacon(`/api/lobbies/${currentLobby.id}`, JSON.stringify({
          action: 'leave',
          player: username,
        }));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      isMounted = false;
      
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
      
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      // Tüm event listener'ları kaldır
      socket.off('connect', handleConnect);
      socket.off('connect', handleConnectionChange);
      socket.off('disconnect', handleDisconnect);
      socket.off('disconnect', handleConnectionChange);
      socket.off('connect_error', handleConnectError);
      socket.off('lobby:list', handleLobbyList);
      socket.off('lobby:list-updated', handleLobbyListUpdated);
      socket.off('lobby:created', handleLobbyCreated);
      socket.off('lobby:updated', handleLobbyUpdated);
      socket.off('lobby:closed', handleLobbyClosed);
      socket.off('game:started', handleGameStarted);
      socket.off('error', handleError);
    };
  }, [gameType, username, router, fetchLobbies]);

  const handleCreateLobby = async (selectedGameType: GameType) => {
    if (!username) {
      console.error('handleCreateLobby: No username');
      return;
    }

    console.log('handleCreateLobby: Starting, gameType:', selectedGameType, 'host:', username);

    // Loading state ekle (duplicate request önlemek için)
    setShowCreateModal(false);

    try {
      console.log('handleCreateLobby: Sending POST request to /api/lobbies');
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

      console.log('handleCreateLobby: Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network error' }));
        console.error('handleCreateLobby: Response not OK:', errorData);
        throw new Error(errorData.error || 'Failed to create lobby');
      }

      const data = await response.json();
      console.log('handleCreateLobby: Response data:', data);
      
      if (data.lobby) {
        console.log('Lobby created via API:', data.lobby);
        setCurrentLobby(data.lobby);
        setView('room');
        
        // Socket.io'ya sadece bildirim gönder (yeni lobi oluşturma!)
        const socket = getSocket();
        if (socket.connected) {
          // Lobi zaten API route ile oluşturuldu, sadece diğer kullanıcılara bildir
          socket.emit('lobby:created-notify', {
            lobbyId: data.lobby.id,
          });
        }
        
        // Lobi listesini yenile
        fetchLobbies();
      } else {
        throw new Error('Lobi oluşturulamadı: Geçersiz yanıt');
      }
    } catch (error) {
      console.error('Error creating lobby:', error);
      // Fallback: Sadece Socket.io ile dene
      const socket = getSocket();
      if (socket.connected) {
        socket.emit('lobby:create', {
          gameType: selectedGameType,
          host: username,
        });
      } else {
        alert('Lobi oluşturulamadı: Sunucuya bağlanılamıyor. Lütfen tekrar deneyin.');
      }
    }
  };

  const handleJoinLobby = async (lobbyId: string) => {
    if (!username) return;

    // Duplicate request önlemek için kontrol
    if (currentLobby && currentLobby.id === lobbyId) {
      setView('room');
      return;
    }

    try {
      // Önce API route ile katıl
      const response = await fetch(`/api/lobbies/${lobbyId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'join',
          player: username,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(errorData.error || 'Failed to join lobby');
      }

      const data = await response.json();
      
      if (data.lobby) {
        console.log('Joined lobby via API:', data.lobby);
        setCurrentLobby(data.lobby);
        setView('room');
        
        // Socket.io'ya da bildir
        const socket = getSocket();
        if (socket.connected) {
          socket.emit('lobby:join', {
            lobbyId,
            player: username,
          });
        }
      } else {
        throw new Error('Lobiye katılamadı: Geçersiz yanıt');
      }
    } catch (error) {
      console.error('Error joining lobby:', error);
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      alert('Lobiye katılamadı: ' + errorMessage);
      
      // Fallback: Sadece Socket.io ile dene (sadece bağlıysa)
      const socket = getSocket();
      if (socket.connected) {
        socket.emit('lobby:join', {
          lobbyId,
          player: username,
        });
      }
    }
  };

  const handleLeaveLobby = async () => {
    if (!currentLobby || !username) return;

    try {
      // API route ile de ayrıl
      await fetch(`/api/lobbies/${currentLobby.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'leave',
          player: username,
        }),
      });
    } catch (error) {
      console.error('Error leaving lobby via API:', error);
    }

    // Socket.io ile de bildir
    const socket = getSocket();
    socket.emit('lobby:leave', {
      lobbyId: currentLobby.id,
      player: username,
    });

    setCurrentLobby(null);
    setView('list');
  };

  const handleStartGame = async () => {
    if (!currentLobby || !username) return;

    // Sadece host oyunu başlatabilir
    if (currentLobby.host !== username) {
      alert('Sadece host oyunu başlatabilir!');
      return;
    }

    // Lobi dolu olmalı
    if (currentLobby.players.length < currentLobby.maxPlayers) {
      alert('Lobi dolu değil!');
      return;
    }

    try {
      // API route ile oyunu başlat
      const response = await fetch(`/api/lobbies/${currentLobby.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'start',
          player: username,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.lobby) {
          // Socket.io'ya da bildir
          const socket = getSocket();
          if (socket.connected) {
            socket.emit('lobby:start', {
              lobbyId: currentLobby.id,
            });
          } else {
            // Socket bağlı değilse direkt yönlendir
            router.push(`/games/${gameType}/play?lobbyId=${currentLobby.id}`);
          }
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Network error' }));
        alert('Oyun başlatılamadı: ' + (errorData.error || 'Bilinmeyen hata'));
      }
    } catch (error) {
      console.error('Error starting game:', error);
      // Fallback: Sadece Socket.io ile dene
      const socket = getSocket();
      if (socket.connected) {
        socket.emit('lobby:start', {
          lobbyId: currentLobby.id,
        });
      } else {
        alert('Oyun başlatılamadı: Sunucuya bağlanılamıyor.');
      }
    }
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
            onLobbyUpdate={(updatedLobby) => {
              console.log('GamePage: Lobby updated from LobbyRoom:', updatedLobby);
              setCurrentLobby(updatedLobby);
            }}
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


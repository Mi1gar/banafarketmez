// Global singleton lobbyManager instance
// Bu dosya hem server.js hem de API route'ları tarafından kullanılacak

class LobbyManager {
  constructor() {
    this.lobbies = new Map();
    this.timeouts = new Map(); // Timeout ID'lerini sakla
    this.LOBBY_TIMEOUT = 30 * 60 * 1000; // 30 dakika
  }

  createLobby(gameType, host) {
    const id = this.generateLobbyId();
    const lobby = {
      id,
      gameType,
      host,
      players: [host],
      status: 'waiting',
      createdAt: new Date(),
      maxPlayers: 2,
    };

    this.lobbies.set(id, lobby);
    this.scheduleLobbyTimeout(id);
    return lobby;
  }

  joinLobby(lobbyId, player) {
    const lobby = this.lobbies.get(lobbyId);
    if (!lobby) {
      console.log('joinLobby: Lobby not found:', lobbyId);
      return null;
    }

    // Eğer oyuncu zaten listede varsa, lobby'yi döndür
    if (lobby.players.includes(player)) {
      console.log('joinLobby: Player already in lobby:', player);
      return lobby;
    }

    // Sadece 'waiting' veya 'full' status'ünde katılabilir (full ama henüz oyun başlamamış)
    if (lobby.status !== 'waiting' && lobby.status !== 'full') {
      console.log('joinLobby: Lobby status is not waiting/full:', lobby.status);
      return null;
    }

    if (lobby.players.length >= lobby.maxPlayers) {
      console.log('joinLobby: Lobby is full:', lobby.players.length, '>=', lobby.maxPlayers);
      return null;
    }

    lobby.players.push(player);
    if (lobby.players.length >= lobby.maxPlayers) {
      lobby.status = 'full';
    }

    this.lobbies.set(lobbyId, lobby);
    console.log('joinLobby: Player added successfully:', player, 'lobby status:', lobby.status);
    return lobby;
  }

  leaveLobby(lobbyId, player) {
    const lobby = this.lobbies.get(lobbyId);
    if (!lobby) return null;

    lobby.players = lobby.players.filter((p) => p !== player);

    if (lobby.players.length === 0) {
      this.closeLobby(lobbyId);
      return null;
    }

    if (lobby.players.length < lobby.maxPlayers) {
      lobby.status = 'waiting';
    }

    if (lobby.host === player && lobby.players.length > 0) {
      lobby.host = lobby.players[0];
    }

    this.lobbies.set(lobbyId, lobby);
    return lobby;
  }

  getLobby(lobbyId) {
    return this.lobbies.get(lobbyId) || null;
  }

  getAllLobbies(gameType) {
    let lobbies = Array.from(this.lobbies.values());
    
    if (gameType) {
      lobbies = lobbies.filter((l) => l.gameType === gameType);
    }

    lobbies = lobbies.filter(
      (l) => l.status === 'waiting' || l.status === 'full'
    );

    const now = new Date();
    lobbies = lobbies.filter((l) => {
      const age = now.getTime() - new Date(l.createdAt).getTime();
      return age < this.LOBBY_TIMEOUT;
    });

    return lobbies.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  startGame(lobbyId) {
    const lobby = this.lobbies.get(lobbyId);
    if (!lobby) {
      console.log('startGame: Lobby not found:', lobbyId);
      return null;
    }

    console.log('startGame: Lobby status:', lobby.status, 'players:', lobby.players.length, 'maxPlayers:', lobby.maxPlayers);
    
    // Lobi dolu olmalı ve oyun başlamamış olmalı
    if (lobby.status !== 'full' && lobby.status !== 'waiting') {
      console.log('startGame: Lobby status is not full/waiting:', lobby.status);
      return null;
    }

    if (lobby.players.length < lobby.maxPlayers) {
      console.log('startGame: Lobby is not full:', lobby.players.length, '<', lobby.maxPlayers);
      return null;
    }

    lobby.status = 'in-game';
    this.lobbies.set(lobbyId, lobby);
    console.log('startGame: Game started successfully for lobby:', lobbyId);
    return lobby;
  }

  closeLobby(lobbyId) {
    const lobby = this.lobbies.get(lobbyId);
    if (lobby) {
      // Timeout'u iptal et
      this.cancelLobbyTimeout(lobbyId);
      
      lobby.status = 'closed';
      this.lobbies.set(lobbyId, lobby);
      
      // 5 dakika sonra tamamen sil
      setTimeout(() => {
        this.lobbies.delete(lobbyId);
        if (this.timeouts) {
          this.timeouts.delete(lobbyId);
        }
      }, 5 * 60 * 1000);
    }
  }

  generateLobbyId() {
    return Math.random().toString(36).substring(2, 9).toUpperCase();
  }

  scheduleLobbyTimeout(lobbyId) {
    // Timeout'u sakla, böylece iptal edilebilir
    const timeoutId = setTimeout(() => {
      const lobby = this.lobbies.get(lobbyId);
      if (lobby && (lobby.status === 'waiting' || lobby.status === 'full')) {
        console.log('Lobby timeout:', lobbyId);
        this.closeLobby(lobbyId);
      }
    }, this.LOBBY_TIMEOUT);
    
    // Timeout ID'yi sakla (ileride iptal etmek için)
    if (!this.timeouts) {
      this.timeouts = new Map();
    }
    this.timeouts.set(lobbyId, timeoutId);
  }

  cancelLobbyTimeout(lobbyId) {
    if (this.timeouts && this.timeouts.has(lobbyId)) {
      clearTimeout(this.timeouts.get(lobbyId));
      this.timeouts.delete(lobbyId);
    }
  }
}

// Global instance - hem CommonJS hem ES modules için
let lobbyManagerInstance = null;

if (typeof global !== 'undefined') {
  // Node.js environment
  if (!global.lobbyManagerInstance) {
    global.lobbyManagerInstance = new LobbyManager();
  }
  lobbyManagerInstance = global.lobbyManagerInstance;
} else {
  // Fallback
  lobbyManagerInstance = new LobbyManager();
}

// CommonJS export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { LobbyManager, lobbyManager: lobbyManagerInstance };
}

// ES modules export
if (typeof exports !== 'undefined') {
  exports.lobbyManager = lobbyManagerInstance;
  exports.LobbyManager = LobbyManager;
}


// Global singleton lobbyManager instance
// Bu dosya hem server.js hem de API route'ları tarafından kullanılacak

class LobbyManager {
  constructor() {
    this.lobbies = new Map();
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
    if (!lobby || lobby.status !== 'waiting') {
      return null;
    }

    if (lobby.players.includes(player)) {
      return lobby;
    }

    if (lobby.players.length >= lobby.maxPlayers) {
      return null;
    }

    lobby.players.push(player);
    if (lobby.players.length >= lobby.maxPlayers) {
      lobby.status = 'full';
    }

    this.lobbies.set(lobbyId, lobby);
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
    if (!lobby || lobby.status !== 'full') {
      return null;
    }

    lobby.status = 'in-game';
    this.lobbies.set(lobbyId, lobby);
    return lobby;
  }

  closeLobby(lobbyId) {
    const lobby = this.lobbies.get(lobbyId);
    if (lobby) {
      lobby.status = 'closed';
      this.lobbies.set(lobbyId, lobby);
      
      setTimeout(() => {
        this.lobbies.delete(lobbyId);
      }, 5 * 60 * 1000);
    }
  }

  generateLobbyId() {
    return Math.random().toString(36).substring(2, 9).toUpperCase();
  }

  scheduleLobbyTimeout(lobbyId) {
    setTimeout(() => {
      const lobby = this.lobbies.get(lobbyId);
      if (lobby && (lobby.status === 'waiting' || lobby.status === 'full')) {
        this.closeLobby(lobbyId);
      }
    }, this.LOBBY_TIMEOUT);
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


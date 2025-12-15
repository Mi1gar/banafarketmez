export type GameType = 'rock-paper-scissors' | 'tic-tac-toe' | 'number-guessing';
export type LobbyStatus = 'waiting' | 'full' | 'in-game' | 'closed';

export interface Lobby {
  id: string;
  gameType: GameType;
  host: string;
  players: string[];
  status: LobbyStatus;
  createdAt: Date;
  maxPlayers: number;
}

export class LobbyManager {
  private lobbies: Map<string, Lobby> = new Map();
  private readonly LOBBY_TIMEOUT = 30 * 60 * 1000; // 30 dakika

  createLobby(gameType: GameType, host: string): Lobby {
    const id = this.generateLobbyId();
    const lobby: Lobby = {
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

  joinLobby(lobbyId: string, player: string): Lobby | null {
    const lobby = this.lobbies.get(lobbyId);
    if (!lobby || lobby.status !== 'waiting') {
      return null;
    }

    if (lobby.players.includes(player)) {
      return lobby; // Zaten oyuncu lobide
    }

    if (lobby.players.length >= lobby.maxPlayers) {
      return null; // Lobi dolu
    }

    lobby.players.push(player);
    if (lobby.players.length >= lobby.maxPlayers) {
      lobby.status = 'full';
    }

    this.lobbies.set(lobbyId, lobby);
    return lobby;
  }

  leaveLobby(lobbyId: string, player: string): Lobby | null {
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

    // Eğer host ayrıldıysa, yeni host belirle
    if (lobby.host === player && lobby.players.length > 0) {
      lobby.host = lobby.players[0];
    }

    this.lobbies.set(lobbyId, lobby);
    return lobby;
  }

  getLobby(lobbyId: string): Lobby | null {
    return this.lobbies.get(lobbyId) || null;
  }

  getAllLobbies(gameType?: GameType): Lobby[] {
    let lobbies = Array.from(this.lobbies.values());
    
    if (gameType) {
      lobbies = lobbies.filter((l) => l.gameType === gameType);
    }

    // Kapalı ve oyunda olan lobileri filtrele
    lobbies = lobbies.filter(
      (l) => l.status === 'waiting' || l.status === 'full'
    );

    // Eski lobileri filtrele (30 dakikadan eski)
    const now = new Date();
    lobbies = lobbies.filter((l) => {
      const age = now.getTime() - l.createdAt.getTime();
      return age < this.LOBBY_TIMEOUT;
    });

    return lobbies.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  startGame(lobbyId: string): Lobby | null {
    const lobby = this.lobbies.get(lobbyId);
    if (!lobby || lobby.status !== 'full') {
      return null;
    }

    lobby.status = 'in-game';
    this.lobbies.set(lobbyId, lobby);
    return lobby;
  }

  closeLobby(lobbyId: string): void {
    const lobby = this.lobbies.get(lobbyId);
    if (lobby) {
      lobby.status = 'closed';
      this.lobbies.set(lobbyId, lobby);
      
      // 5 dakika sonra tamamen sil
      setTimeout(() => {
        this.lobbies.delete(lobbyId);
      }, 5 * 60 * 1000);
    }
  }

  private generateLobbyId(): string {
    return Math.random().toString(36).substring(2, 9).toUpperCase();
  }

  private scheduleLobbyTimeout(lobbyId: string): void {
    setTimeout(() => {
      const lobby = this.lobbies.get(lobbyId);
      if (lobby && (lobby.status === 'waiting' || lobby.status === 'full')) {
        this.closeLobby(lobbyId);
      }
    }, this.LOBBY_TIMEOUT);
  }
}

// Singleton instance
export const lobbyManager = new LobbyManager();


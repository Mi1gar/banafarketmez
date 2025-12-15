import { NextRequest, NextResponse } from 'next/server';

// Global singleton lobbyManager instance kullan
// @ts-ignore - CommonJS module
const lobbyManagerModule = require('@/lib/lobbyManagerSingleton.js');
const lobbyManager = lobbyManagerModule.lobbyManager || lobbyManagerModule.default?.lobbyManager;

type GameType = 'rock-paper-scissors' | 'tic-tac-toe' | 'number-guessing';

export async function GET(request: NextRequest) {
  console.log('[API GET /api/lobbies] Request received at:', new Date().toISOString());
  try {
    const searchParams = request.nextUrl.searchParams;
    const gameType = searchParams.get('gameType') as GameType | null;
    console.log('[API GET /api/lobbies] gameType:', gameType);

    if (!lobbyManager) {
      console.error('[API GET /api/lobbies] lobbyManager is not available');
      return NextResponse.json(
        { error: 'Lobi yöneticisi kullanılamıyor' },
        { status: 500 }
      );
    }

    const lobbies = lobbyManager.getAllLobbies(gameType || undefined);
    console.log('[API GET /api/lobbies] Found lobbies:', lobbies.length, 'for gameType:', gameType);
    console.log('[API GET /api/lobbies] Lobby IDs:', lobbies.map((l: any) => l.id));
    
    return NextResponse.json({ lobbies }, { status: 200 });
  } catch (error) {
    console.error('Error fetching lobbies:', error);
    return NextResponse.json(
      { error: 'Lobiler alınırken hata oluştu' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  console.log('API POST /api/lobbies - Request received');
  try {
    const body = await request.json();
    console.log('API POST /api/lobbies - Body:', body);
    const { gameType, host } = body;

    if (!gameType || !host) {
      console.error('API POST /api/lobbies - Missing gameType or host:', { gameType, host });
      return NextResponse.json(
        { error: 'gameType ve host gerekli' },
        { status: 400 }
      );
    }

    const validGameTypes: GameType[] = [
      'rock-paper-scissors',
      'tic-tac-toe',
      'number-guessing',
    ];
    if (!validGameTypes.includes(gameType)) {
      return NextResponse.json(
        { error: 'Geçersiz oyun tipi' },
        { status: 400 }
      );
    }

    if (!lobbyManager) {
      console.error('API: lobbyManager is not available');
      return NextResponse.json(
        { error: 'Lobi yöneticisi kullanılamıyor' },
        { status: 500 }
      );
    }

    const lobby = lobbyManager.createLobby(gameType, host);
    console.log('API: Lobby created:', lobby.id, 'for game:', gameType, 'host:', host);
    console.log('API: Total lobbies now:', lobbyManager.getAllLobbies().length);
    
    return NextResponse.json({ lobby }, { status: 201 });
  } catch (error) {
    console.error('Error creating lobby:', error);
    return NextResponse.json(
      { error: 'Lobi oluşturulurken hata oluştu' },
      { status: 500 }
    );
  }
}


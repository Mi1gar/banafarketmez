import { NextRequest, NextResponse } from 'next/server';

// Global singleton lobbyManager instance kullan
// @ts-ignore - CommonJS module
const lobbyManagerModule = require('@/lib/lobbyManagerSingleton.js');
const lobbyManager = lobbyManagerModule.lobbyManager || lobbyManagerModule.default?.lobbyManager;

type GameType = 'rock-paper-scissors' | 'tic-tac-toe' | 'number-guessing';

export async function GET(request: NextRequest) {
  console.log('[API GET /api/lobbies] Request received at:', new Date().toISOString());
  try {
    if (!lobbyManager) {
      console.error('[API GET /api/lobbies] lobbyManager is null!');
      return NextResponse.json(
        { error: 'Lobi yöneticisi kullanılamıyor' },
        { status: 500 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const gameType = searchParams.get('gameType') as GameType | null;
    console.log('[API GET /api/lobbies] gameType:', gameType);

    const lobbies = lobbyManager.getAllLobbies(gameType || undefined);
    console.log('[API GET /api/lobbies] Found lobbies:', lobbies.length, 'for gameType:', gameType);
    console.log('[API GET /api/lobbies] Lobby IDs:', lobbies.map((l: any) => l.id));
    
    return NextResponse.json({ lobbies }, { status: 200 });
  } catch (error) {
    console.error('[API GET /api/lobbies] Error:', error);
    return NextResponse.json(
      { error: 'Lobiler alınırken hata oluştu' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  console.log('[API POST /api/lobbies] Request received at:', new Date().toISOString());
  try {
    if (!lobbyManager) {
      console.error('[API POST /api/lobbies] lobbyManager is null!');
      return NextResponse.json(
        { error: 'Lobi yöneticisi kullanılamıyor' },
        { status: 500 }
      );
    }

    const body = await request.json();
    console.log('[API POST /api/lobbies] Request body:', body);
    const { gameType, host } = body;

    if (!gameType || !host) {
      console.error('[API POST /api/lobbies] Missing gameType or host');
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

    console.log('[API POST /api/lobbies] Creating lobby for gameType:', gameType, 'host:', host);
    const lobby = lobbyManager.createLobby(gameType, host);
    console.log('[API POST /api/lobbies] Lobby created successfully!');
    console.log('[API POST /api/lobbies] Lobby ID:', lobby.id);
    console.log('[API POST /api/lobbies] Lobby details:', JSON.stringify(lobby, null, 2));
    console.log('[API POST /api/lobbies] Total lobbies now:', lobbyManager.getAllLobbies().length);
    console.log('[API POST /api/lobbies] All lobby IDs:', lobbyManager.getAllLobbies().map((l: any) => l.id));
    
    return NextResponse.json({ lobby }, { status: 201 });
  } catch (error) {
    console.error('Error creating lobby:', error);
    return NextResponse.json(
      { error: 'Lobi oluşturulurken hata oluştu' },
      { status: 500 }
    );
  }
}


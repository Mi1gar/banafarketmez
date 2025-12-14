import { NextRequest, NextResponse } from 'next/server';

// Global singleton lobbyManager instance kullan
// @ts-ignore - CommonJS module
const lobbyManagerModule = require('@/lib/lobbyManagerSingleton.js');
const lobbyManager = lobbyManagerModule.lobbyManager || lobbyManagerModule.default?.lobbyManager;

type GameType = 'rock-paper-scissors' | 'tic-tac-toe' | 'number-guessing';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const gameType = searchParams.get('gameType') as GameType | null;

    const lobbies = lobbyManager.getAllLobbies(gameType || undefined);
    console.log('API: Fetching lobbies, found:', lobbies.length, 'for gameType:', gameType);
    
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
  try {
    const body = await request.json();
    const { gameType, host } = body;

    if (!gameType || !host) {
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


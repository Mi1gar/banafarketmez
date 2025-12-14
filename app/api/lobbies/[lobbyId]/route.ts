import { NextRequest, NextResponse } from 'next/server';

// Global singleton lobbyManager instance kullan
// @ts-ignore - CommonJS module
const lobbyManagerModule = require('@/lib/lobbyManagerSingleton.js');
const lobbyManager = lobbyManagerModule.lobbyManager || lobbyManagerModule.default?.lobbyManager;

export async function GET(
  request: NextRequest,
  { params }: { params: { lobbyId: string } }
) {
  try {
    const { lobbyId } = params;
    const lobby = lobbyManager.getLobby(lobbyId);

    if (!lobby) {
      return NextResponse.json(
        { error: 'Lobi bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json({ lobby }, { status: 200 });
  } catch (error) {
    console.error('Error fetching lobby:', error);
    return NextResponse.json(
      { error: 'Lobi alınırken hata oluştu' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { lobbyId: string } }
) {
  try {
    const { lobbyId } = params;
    const body = await request.json();
    const { action, player } = body;

    if (!action || !player) {
      return NextResponse.json(
        { error: 'action ve player gerekli' },
        { status: 400 }
      );
    }

    let lobby;

    if (!lobbyManager) {
      console.error('API: lobbyManager is not available');
      return NextResponse.json(
        { error: 'Lobi yöneticisi kullanılamıyor' },
        { status: 500 }
      );
    }

    switch (action) {
      case 'join':
        console.log('API: Joining lobby:', lobbyId, 'player:', player);
        lobby = lobbyManager.joinLobby(lobbyId, player);
        if (!lobby) {
          console.error('API: Failed to join lobby:', lobbyId);
          return NextResponse.json(
            { error: 'Lobiye katılamadı (lobi dolu veya bulunamadı)' },
            { status: 400 }
          );
        }
        console.log('API: Player joined, lobby now has:', lobby.players.length, 'players');
        break;

      case 'leave':
        console.log('API: Leaving lobby:', lobbyId, 'player:', player);
        if (!lobbyManager) {
          return NextResponse.json(
            { error: 'Lobi yöneticisi kullanılamıyor' },
            { status: 500 }
          );
        }
        lobby = lobbyManager.leaveLobby(lobbyId, player);
        if (!lobby) {
          console.log('API: Lobby closed (no players left):', lobbyId);
          return NextResponse.json(
            { message: 'Lobiden ayrıldınız, lobi kapandı', lobby: null },
            { status: 200 }
          );
        }
        console.log('API: Player left, remaining players:', lobby.players.length);
        break;

      case 'start':
        lobby = lobbyManager.startGame(lobbyId);
        if (!lobby) {
          return NextResponse.json(
            { error: 'Oyun başlatılamadı' },
            { status: 400 }
          );
        }
        break;

      case 'close':
        lobbyManager.closeLobby(lobbyId);
        return NextResponse.json(
          { message: 'Lobi kapatıldı' },
          { status: 200 }
        );

      default:
        return NextResponse.json(
          { error: 'Geçersiz action' },
          { status: 400 }
        );
    }

    return NextResponse.json({ lobby }, { status: 200 });
  } catch (error) {
    console.error('Error updating lobby:', error);
    return NextResponse.json(
      { error: 'Lobi güncellenirken hata oluştu' },
      { status: 500 }
    );
  }
}


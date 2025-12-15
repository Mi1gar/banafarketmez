const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const { lobbyManager } = require('./lib/lobbyManagerSingleton.js');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  const io = new Server(httpServer, {
    path: '/api/socket',
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Lobi oluşturma (fallback - API route başarısız olursa)
    socket.on('lobby:create', (data) => {
      console.log('lobby:create event received (fallback):', data);
      try {
        if (!data.gameType || !data.host) {
          console.error('Missing gameType or host:', data);
          socket.emit('error', { message: 'gameType ve host gerekli' });
          return;
        }
        const lobby = lobbyManager.createLobby(data.gameType, data.host);
        console.log('Lobby created (fallback):', lobby.id, 'for game:', data.gameType, 'host:', data.host);
        socket.join(`lobby:${lobby.id}`);
        socket.emit('lobby:created', lobby);
        // Tüm kullanıcılara lobi listesi güncellendiğini bildir
        io.emit('lobby:list-updated');
        console.log('lobby:list-updated event emitted to all clients');
      } catch (error) {
        console.error('Error creating lobby:', error);
        socket.emit('error', { message: 'Lobi oluşturulamadı' });
      }
    });

    // Lobi oluşturuldu bildirimi (API route ile oluşturulduktan sonra)
    socket.on('lobby:created-notify', (data) => {
      console.log('lobby:created-notify event received:', data);
      if (data.lobbyId) {
        socket.join(`lobby:${data.lobbyId}`);
        // Tüm kullanıcılara lobi listesi güncellendiğini bildir
        io.emit('lobby:list-updated');
        console.log('lobby:list-updated event emitted (after API create)');
      }
    });

    // Lobiye katılma
    socket.on('lobby:join', (data) => {
      console.log('lobby:join event received:', data);
      try {
        if (!data.lobbyId || !data.player) {
          console.error('Missing lobbyId or player:', data);
          socket.emit('error', { message: 'lobbyId ve player gerekli' });
          return;
        }
        
        // Önce mevcut lobby'yi kontrol et
        const existingLobby = lobbyManager.getLobby(data.lobbyId);
        if (existingLobby && existingLobby.players.includes(data.player)) {
          // Oyuncu zaten lobide, sadece socket room'a ekle ve güncelle
          console.log('Player already in lobby, just joining socket room:', data.player);
          socket.join(`lobby:${existingLobby.id}`);
          console.log('Socket joined room:', `lobby:${existingLobby.id}`, 'socket id:', socket.id);
          
          // Eğer oyun zaten başlamışsa, game:started event'ini gönder
          if (existingLobby.status === 'in-game') {
            console.log('Lobby already in-game, sending game:started to player:', data.player);
            socket.emit('game:started', {
              lobby: existingLobby,
              gameType: existingLobby.gameType,
              players: existingLobby.players,
              player1Name: existingLobby.players[0],
              player2Name: existingLobby.players[1] || existingLobby.players[0],
            });
          }
          
          io.to(`lobby:${existingLobby.id}`).emit('lobby:updated', existingLobby);
          io.emit('lobby:list-updated');
          return;
        }

        const lobby = lobbyManager.joinLobby(data.lobbyId, data.player);
        if (lobby) {
          console.log('Player joined lobby:', data.player, 'lobby:', lobby.id);
          console.log('Lobby players now:', lobby.players);
          console.log('Lobby status:', lobby.status);
          socket.join(`lobby:${lobby.id}`);
          // Lobi odasındaki tüm oyunculara güncellenmiş lobi bilgisini gönder
          io.to(`lobby:${lobby.id}`).emit('lobby:updated', lobby);
          console.log('lobby:updated event emitted to room:', `lobby:${lobby.id}`);
          // Tüm kullanıcılara lobi listesi güncellendiğini bildir
          io.emit('lobby:list-updated');
          console.log('lobby:list-updated event emitted to all clients');
        } else {
          console.error('Failed to join lobby:', data.lobbyId, 'player:', data.player);
          const checkLobby = lobbyManager.getLobby(data.lobbyId);
          console.error('Existing lobby state:', checkLobby ? {
            id: checkLobby.id,
            status: checkLobby.status,
            players: checkLobby.players,
            maxPlayers: checkLobby.maxPlayers
          } : 'null');
          socket.emit('error', { message: 'Lobiye katılamadı (lobi dolu veya bulunamadı)' });
        }
      } catch (error) {
        console.error('Error joining lobby:', error);
        socket.emit('error', { message: 'Lobiye katılırken hata oluştu' });
      }
    });

    // Lobiden ayrılma
    socket.on('lobby:leave', (data) => {
      console.log('lobby:leave event received:', data);
      try {
        const lobby = lobbyManager.leaveLobby(data.lobbyId, data.player);
        socket.leave(`lobby:${data.lobbyId}`);
        if (lobby) {
          console.log('Player left lobby, remaining players:', lobby.players);
          // Kalan oyunculara güncellenmiş lobi bilgisini gönder
          io.to(`lobby:${data.lobbyId}`).emit('lobby:updated', lobby);
        } else {
          console.log('Lobby closed (no players left):', data.lobbyId);
          // Lobi kapandı, odadaki herkese bildir
          io.to(`lobby:${data.lobbyId}`).emit('lobby:closed', { lobbyId: data.lobbyId });
        }
        // Tüm kullanıcılara lobi listesi güncellendiğini bildir
        io.emit('lobby:list-updated');
        console.log('lobby:list-updated event emitted (after leave)');
      } catch (error) {
        console.error('Error leaving lobby:', error);
      }
    });

    // Oyun başlatma
    socket.on('lobby:start', (data) => {
      console.log('lobby:start event received:', data);
      try {
        if (!data.lobbyId) {
          console.error('Missing lobbyId in lobby:start');
          socket.emit('error', { message: 'lobbyId gerekli' });
          return;
        }
        
        // Önce lobby'yi kontrol et
        const checkLobby = lobbyManager.getLobby(data.lobbyId);
        if (!checkLobby) {
          console.error('startGame: Lobby not found:', data.lobbyId);
          socket.emit('error', { message: 'Oyun başlatılamadı (lobi bulunamadı)' });
          return;
        }
        
        console.log('startGame: Attempting to start game for lobby:', data.lobbyId);
        console.log('startGame: Lobby status:', checkLobby.status, 'players:', checkLobby.players.length, 'maxPlayers:', checkLobby.maxPlayers);
        
        // Eğer lobby zaten in-game status'ündeyse, sadece game:started event'ini tekrar gönder
        if (checkLobby.status === 'in-game') {
          console.log('Lobby already in-game, resending game:started event to all players');
          const gameStartedData = {
            lobby: checkLobby,
            gameType: checkLobby.gameType,
            players: checkLobby.players,
            player1Name: checkLobby.players[0],
            player2Name: checkLobby.players[1] || checkLobby.players[0],
          };
          
          // Tüm oyunculara gönder
          io.to(`lobby:${checkLobby.id}`).emit('game:started', gameStartedData);
          console.log('game:started event re-emitted to lobby:', checkLobby.id, 'data:', JSON.stringify(gameStartedData));
          
          // Socket room üyelerini kontrol et
          const room = io.sockets.adapter.rooms.get(`lobby:${checkLobby.id}`);
          console.log('Socket room members:', room ? Array.from(room).length : 0, 'players');
          return;
        }
        
        const lobby = lobbyManager.startGame(data.lobbyId);
        if (lobby) {
          console.log('Game started for lobby:', lobby.id, 'players:', lobby.players);
          
          // Tüm oyuncuların socket room'a katıldığından emin ol
          const room = io.sockets.adapter.rooms.get(`lobby:${lobby.id}`);
          console.log('Socket room members for lobby:', lobby.id, ':', room ? Array.from(room) : 'no room');
          
          // Lobi bilgileri ile birlikte oyun başlatma event'i gönder
          const gameStartedData = {
            lobby,
            gameType: lobby.gameType,
            players: lobby.players,
            player1Name: lobby.players[0],
            player2Name: lobby.players[1] || lobby.players[0],
          };
          
          io.to(`lobby:${lobby.id}`).emit('game:started', gameStartedData);
          console.log('game:started event emitted to lobby:', lobby.id, 'data:', JSON.stringify(gameStartedData));
          
          // Ayrıca tüm oyunculara direkt olarak da gönder (fallback)
          lobby.players.forEach((player) => {
            console.log('Sending game:started to player:', player);
          });
        } else {
          console.error('Failed to start game for lobby:', data.lobbyId);
          const currentLobby = lobbyManager.getLobby(data.lobbyId);
          console.error('Current lobby state:', currentLobby ? {
            id: currentLobby.id,
            status: currentLobby.status,
            players: currentLobby.players,
            maxPlayers: currentLobby.maxPlayers
          } : 'null');
          socket.emit('error', { message: 'Oyun başlatılamadı (lobi bulunamadı veya dolu değil)' });
        }
      } catch (error) {
        console.error('Error starting game:', error);
        socket.emit('error', { message: 'Oyun başlatılamadı' });
      }
    });

    // Oyun hamlesi
    socket.on('game:move', (data) => {
      console.log('game:move event received:', data);
      // Tüm oyunculara hamleyi ilet
      io.to(`lobby:${data.lobbyId}`).emit('game:move', data);
      console.log('game:move event emitted to lobby:', data.lobbyId);
    });

    // Oyun bitişi
    socket.on('game:end', (data) => {
      io.to(`lobby:${data.lobbyId}`).emit('game:ended', data);
    });

    // Lobi listesi isteği
    socket.on('lobby:list', (data) => {
      try {
        const lobbies = lobbyManager.getAllLobbies(data?.gameType);
        socket.emit('lobby:list', lobbies);
      } catch (error) {
        console.error('Error getting lobby list:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      // Disconnect olduğunda kullanıcının tüm lobilerinden ayrılması gerekebilir
      // Ancak bu durumda kullanıcı bilgisi yok, bu yüzden sadece log tutuyoruz
      // Gerçek uygulamada socket.id ile kullanıcı mapping'i yapılabilir
    });
  });

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});


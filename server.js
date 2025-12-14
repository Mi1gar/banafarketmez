const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const { lobbyManager } = require('./lib/lobbyManager.js');

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

    // Lobi oluşturma
    socket.on('lobby:create', (data) => {
      console.log('lobby:create event received:', data);
      try {
        if (!data.gameType || !data.host) {
          console.error('Missing gameType or host:', data);
          socket.emit('error', { message: 'gameType ve host gerekli' });
          return;
        }
        const lobby = lobbyManager.createLobby(data.gameType, data.host);
        console.log('Lobby created:', lobby.id, 'for game:', data.gameType, 'host:', data.host);
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

    // Lobiye katılma
    socket.on('lobby:join', (data) => {
      try {
        const lobby = lobbyManager.joinLobby(data.lobbyId, data.player);
        if (lobby) {
          socket.join(`lobby:${lobby.id}`);
          io.to(`lobby:${lobby.id}`).emit('lobby:updated', lobby);
          io.emit('lobby:list-updated');
        } else {
          socket.emit('error', { message: 'Lobiye katılamadı' });
        }
      } catch (error) {
        console.error('Error joining lobby:', error);
        socket.emit('error', { message: 'Lobiye katılırken hata oluştu' });
      }
    });

    // Lobiden ayrılma
    socket.on('lobby:leave', (data) => {
      try {
        const lobby = lobbyManager.leaveLobby(data.lobbyId, data.player);
        socket.leave(`lobby:${data.lobbyId}`);
        if (lobby) {
          io.to(`lobby:${data.lobbyId}`).emit('lobby:updated', lobby);
        }
        io.emit('lobby:list-updated');
      } catch (error) {
        console.error('Error leaving lobby:', error);
      }
    });

    // Oyun başlatma
    socket.on('lobby:start', (data) => {
      try {
        const lobby = lobbyManager.startGame(data.lobbyId);
        if (lobby) {
          io.to(`lobby:${lobby.id}`).emit('game:started', lobby);
        }
      } catch (error) {
        console.error('Error starting game:', error);
        socket.emit('error', { message: 'Oyun başlatılamadı' });
      }
    });

    // Oyun hamlesi
    socket.on('game:move', (data) => {
      io.to(`lobby:${data.lobbyId}`).emit('game:move', data);
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


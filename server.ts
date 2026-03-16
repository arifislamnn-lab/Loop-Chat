import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';

async function startServer() {
  const app = express();
  const server = createServer(app);
  const io = new Server(server, {
    cors: {
      origin: '*',
    },
  });
  const PORT = 3000;

  // API routes FIRST
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Socket.io logic
  let waitingUser: string | null = null;
  const users = new Map<string, string>(); // Maps socket.id to partner's socket.id
  let totalChats = 0;
  let activeUsers = 0;

  const broadcastStats = () => {
    io.emit('stats_update', {
      activeUsers,
      totalChats,
    });
  };

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    activeUsers++;
    broadcastStats();

    socket.on('find_partner', () => {
      console.log(`User ${socket.id} is looking for a partner`);
      if (waitingUser && waitingUser !== socket.id) {
        // Match found
        console.log(`Matching ${socket.id} with ${waitingUser}`);
        const partnerId = waitingUser;
        users.set(socket.id, partnerId);
        users.set(partnerId, socket.id);
        waitingUser = null;
        totalChats++;
        broadcastStats();

        io.to(socket.id).emit('partner_found', { partnerId });
        io.to(partnerId).emit('partner_found', { partnerId: socket.id });
      } else {
        // Wait for partner
        console.log(`User ${socket.id} is waiting`);
        waitingUser = socket.id;
        socket.emit('waiting_for_partner');
      }
    });

    socket.on('send_message', (data) => {
      const partnerId = users.get(socket.id);
      if (partnerId) {
        io.to(partnerId).emit('receive_message', {
          message: data.message,
          senderId: socket.id,
          replyTo: data.replyTo,
        });
      }
    });

    socket.on('typing', (isTyping) => {
      const partnerId = users.get(socket.id);
      if (partnerId) {
        io.to(partnerId).emit('partner_typing', isTyping);
      }
    });

    socket.on('leave_chat', () => {
      const partnerId = users.get(socket.id);
      if (partnerId) {
        users.delete(socket.id);
        users.delete(partnerId);
        io.to(partnerId).emit('partner_left');
      } else if (waitingUser === socket.id) {
        waitingUser = null;
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      activeUsers--;
      broadcastStats();
      const partnerId = users.get(socket.id);
      if (partnerId) {
        users.delete(socket.id);
        users.delete(partnerId);
        io.to(partnerId).emit('partner_left');
      } else if (waitingUser === socket.id) {
        waitingUser = null;
      }
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

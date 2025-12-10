/**
 * Socket.IO Configuration
 *
 * Konfigurasi dan setup Socket.IO untuk real-time notifications
 */

const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const authConfig = require("./auth");
const { User } = require("../models");

let io = null;

// Store connected users: userId -> Set of socket IDs
const connectedUsers = new Map();

/**
 * Initialize Socket.IO server
 * @param {http.Server} httpServer - HTTP server instance
 * @returns {Server} Socket.IO server instance
 */
const initializeSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;

      if (!token) {
        return next(new Error("Authentication required"));
      }

      // Verify JWT token
      const decoded = jwt.verify(token, authConfig.secret);

      // Get user from database
      const user = await User.findByPk(decoded.id, {
        attributes: ["id", "username", "full_name", "email", "role", "avatar"],
      });

      if (!user) {
        return next(new Error("User not found"));
      }

      // Attach user to socket
      socket.user = user.toJSON();
      next();
    } catch (error) {
      console.error("[Socket] Authentication error:", error.message);
      next(new Error("Invalid token"));
    }
  });

  // Connection handler
  io.on("connection", (socket) => {
    const userId = socket.user.id;
    console.log(
      `[Socket] User connected: ${socket.user.username} (${socket.id})`
    );

    // Add to connected users
    if (!connectedUsers.has(userId)) {
      connectedUsers.set(userId, new Set());
    }
    connectedUsers.get(userId).add(socket.id);

    // Join user's personal room
    socket.join(`user:${userId}`);

    // Join project rooms if needed
    socket.on("join:project", (projectId) => {
      socket.join(`project:${projectId}`);
      console.log(
        `[Socket] ${socket.user.username} joined project:${projectId}`
      );
    });

    socket.on("leave:project", (projectId) => {
      socket.leave(`project:${projectId}`);
      console.log(`[Socket] ${socket.user.username} left project:${projectId}`);
    });

    // Handle disconnect
    socket.on("disconnect", (reason) => {
      console.log(
        `[Socket] User disconnected: ${socket.user.username} (${reason})`
      );

      // Remove from connected users
      if (connectedUsers.has(userId)) {
        connectedUsers.get(userId).delete(socket.id);
        if (connectedUsers.get(userId).size === 0) {
          connectedUsers.delete(userId);
        }
      }
    });

    // Handle errors
    socket.on("error", (error) => {
      console.error(`[Socket] Error for ${socket.user.username}:`, error);
    });

    // Send connection confirmation
    socket.emit("connected", {
      message: "Successfully connected to notification server",
      userId: socket.user.id,
      username: socket.user.username,
    });
  });

  console.log("[Socket] ✓ Socket.IO initialized");
  return io;
};

/**
 * Get Socket.IO instance
 * @returns {Server|null} Socket.IO server instance
 */
const getIO = () => {
  if (!io) {
    console.warn("[Socket] Socket.IO not initialized");
  }
  return io;
};

/**
 * Check if user is online
 * @param {number} userId - User ID
 * @returns {boolean}
 */
const isUserOnline = (userId) => {
  return connectedUsers.has(userId) && connectedUsers.get(userId).size > 0;
};

/**
 * Get online users count
 * @returns {number}
 */
const getOnlineUsersCount = () => {
  return connectedUsers.size;
};

/**
 * Get all online user IDs
 * @returns {Array<number>}
 */
const getOnlineUserIds = () => {
  return Array.from(connectedUsers.keys());
};

/**
 * Emit to specific user
 * @param {number} userId - User ID
 * @param {string} event - Event name
 * @param {any} data - Event data
 */
const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

/**
 * Emit to project room
 * @param {number} projectId - Project ID
 * @param {string} event - Event name
 * @param {any} data - Event data
 */
const emitToProject = (projectId, event, data) => {
  if (io) {
    io.to(`project:${projectId}`).emit(event, data);
  }
};

/**
 * Emit to all connected clients
 * @param {string} event - Event name
 * @param {any} data - Event data
 */
const emitToAll = (event, data) => {
  if (io) {
    io.emit(event, data);
  }
};

module.exports = {
  initializeSocket,
  getIO,
  isUserOnline,
  getOnlineUsersCount,
  getOnlineUserIds,
  emitToUser,
  emitToProject,
  emitToAll,
};

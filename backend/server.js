require("dotenv").config();
const http = require("http");
const app = require("./src/app");
const { sequelize } = require("./src/models");
const { initializeDatabase } = require("./src/utils/dbSync");
const { initializeSocket } = require("./src/config/socket");

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
initializeSocket(server);

// Initialize database and start server
const startServer = async () => {
  try {
    // Initialize database (connection + optional sync based on DB_AUTO_SYNC)
    const dbStatus = await initializeDatabase(sequelize);

    // Log sync status
    if (dbStatus.synced) {
      console.log(`📊 Database sync mode: ${dbStatus.mode}`);
    }

    // Start server with Socket.IO
    server.listen(PORT, () => {
      console.log("");
      console.log("🚀 Server is running!");
      console.log(`   Port: ${PORT}`);
      console.log(`   Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`   API URL: http://localhost:${PORT}/api`);
      console.log(`   🔌 Socket.IO: Enabled`);
      console.log("");
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err.message);
    process.exit(1);
  }
};

// Start the server
startServer();

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Promise Rejection:", err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
  process.exit(1);
});

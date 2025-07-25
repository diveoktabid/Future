const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const path = require("path");
const http = require("http");
const socketIo = require("socket.io");
require("dotenv").config({ path: path.join(__dirname, '.env') });

// Import routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const deviceRoutes = require("./routes/devices");
const dataRoutes = require("./routes/data");
const hospitalRoutes = require("./routes/hospitals");

// Import new real-time monitoring routes (BARU)
const monitoringRoutes = require("./routes/monitoring");

// Import middleware
const errorHandler = require("./middleware/errorHandler");
const { authenticateToken } = require("./middleware/auth");

// Import database connection for testing
const { testConnection } = require("./config/database");

const app = express();
const server = http.createServer(app);

// Setup Socket.IO dengan CORS (BARU)
const io = socketIo(server, {
  cors: {
    origin: function (origin, callback) {
      const allowedOrigins = [
        process.env.FRONTEND_URL || "http://localhost:3000",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
      ];
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST"],
    credentials: true
  }
});

const PORT = process.env.PORT || 5000;

// Make io available globally untuk routes (BARU)
app.set('io', io);

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// Rate limiting dengan pengecualian untuk IoT endpoints (UPDATED)
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting untuk monitoring endpoints (untuk IoT devices)
  skip: (req) => {
    return req.path.startsWith('/api/monitoring/');
  }
});

app.use("/api/", limiter);

// CORS configuration (SAMA SEPERTI SEBELUMNYA)
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL || "http://localhost:3000",
      "http://localhost:3000",
      "http://127.0.0.1:3000",
    ];

    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

app.use(cors(corsOptions));

// Compression middleware
app.use(compression());

// Logging middleware dengan tambahan info untuk real-time (UPDATED)
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Serve static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Health check endpoint (UPDATED dengan WebSocket info)
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Bartech API Server is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    version: require("./package.json").version,
    features: {
      websocket: true,
      realtime_monitoring: true,
      iot_support: true
    },
    websocket: {
      connected_clients: io.engine.clientsCount
    }
  });
});

// WebSocket Connection Handling (BARU)
io.on('connection', (socket) => {
  console.log(`🔌 WebSocket client connected: ${socket.id}`);
  
  // Send welcome message
  socket.emit('connected', { 
    message: 'Connected to Bartech Real-time Monitoring',
    timestamp: new Date().toISOString(),
    clientId: socket.id
  });
  
  // Handle client requesting latest data
  socket.on('request_latest_data', async () => {
    try {
      const { executeQuery } = require('./config/database');
      const latestData = await executeQuery('SELECT * FROM latest_monitoring_data ORDER BY hospital_id ASC');
      socket.emit('latest_data', latestData);
    } catch (error) {
      socket.emit('error', { message: 'Failed to fetch latest data' });
    }
  });
  
  // Handle client disconnect
  socket.on('disconnect', () => {
    console.log(`🔌 WebSocket client disconnected: ${socket.id}`);
  });
});

// API Routes (EXISTING - TIDAK BERUBAH)
app.use("/api/auth", authRoutes);
app.use("/api/users", authenticateToken, userRoutes);
app.use("/api/devices", authenticateToken, deviceRoutes);
app.use("/api/data", authenticateToken, dataRoutes);
app.use("/api/hospitals", authenticateToken, hospitalRoutes);

// New Real-time Monitoring Routes (BARU - TANPA AUTH untuk IoT)
app.use("/api/monitoring", monitoringRoutes);

// Root endpoint dengan info real-time (UPDATED)
app.get("/", (req, res) => {
  res.json({
    message: "Bartech IoT Monitoring API Server",
    version: require("./package.json").version,
    status: "running",
    timestamp: new Date().toISOString(),
    features: {
      authentication: true,
      websocket: true,
      realtime_monitoring: true,
      iot_submission: true
    },
    endpoints: {
      // Existing endpoints
      auth: "/api/auth",
      users: "/api/users",
      devices: "/api/devices", 
      data: "/api/data",
      hospitals: "/api/hospitals",
      // New real-time endpoints
      monitoring_submit: "POST /api/monitoring/submit",
      monitoring_latest: "GET /api/monitoring/latest",
      hospital_status: "GET /api/monitoring/hospitals/status"
    },
    websocket: {
      url: `ws://localhost:${PORT}`,
      events: ['monitoring_update', 'hospital_status_update', 'latest_data'],
      connected_clients: io.engine.clientsCount
    }
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    status: "error",
    message: "API endpoint not found",
    path: req.originalUrl,
  });
});

// Global error handler
app.use(errorHandler);

// Graceful shutdown dengan WebSocket cleanup (UPDATED)
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT received. Shutting down gracefully...");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

// Start server dengan database test (UPDATED)
server.listen(PORT, async () => {
  console.log(`
🚀 Bartech IoT API Server is running!
📍 Port: ${PORT}
🌍 Environment: ${process.env.NODE_ENV || "development"}
🔗 Health Check: http://localhost:${PORT}/health
📚 API Base URL: http://localhost:${PORT}/api
🔌 WebSocket URL: ws://localhost:${PORT}
⚡ Real-time Features: ENABLED
🏥 IoT Monitoring: ENABLED
⏰ Started at: ${new Date().toLocaleString()}
  `);

  // Test database connection
  const dbConnected = await testConnection();
  if (dbConnected) {
    console.log("✅ Database connection established");
  } else {
    console.log("❌ Database connection failed - some features may not work");
  }

  console.log(`🔌 WebSocket server ready for real-time connections`);
});

// Export server dan io untuk testing (BARU)
module.exports = { app, server, io };
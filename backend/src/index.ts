import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import path from "path";
import { SocketIoRealtimeGateway } from "./realtime/realtimeGateway";
import { setRealtimeGateway } from "./services/characterService";
import { setSessionRealtimeGateway } from "./services/sessionService";
import { initRepositories } from "./repositories/repositoryFactory";
import characterRoutes from "./routes/characters";
import campaignRoutes from "./routes/campaigns";
import sessionRoutes from "./routes/sessions";
import threatGroupRoutes from "./routes/threatGroups";
import locationGroupRoutes from "./routes/locationGroups";

const app = express();
const httpServer = createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:3000" }));
app.use(express.json());

// Realtime gateway
const gateway = new SocketIoRealtimeGateway(io);
setRealtimeGateway(gateway);
setSessionRealtimeGateway(gateway);

// API Routes
app.use("/api/characters", characterRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/threatGroups", threatGroupRoutes);
app.use("/api/locationGroups", locationGroupRoutes);

// Serve frontend static files
const frontendPath = path.join(__dirname, "..", "public");
app.use(express.static(frontendPath));

// SPA fallback - serve index.html for all non-API routes
app.get("*", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);
  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

const PORT = parseInt(process.env.PORT || "3001", 10);

// Start HTTP server immediately so App Service health checks pass
httpServer.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});

// Then initialize repositories (MongoDB connection etc.)
initRepositories()
  .then(() => {
    if (process.env.USE_MONGODB === "true") {
      console.log("Using MongoDB database");
    } else if (process.env.USE_COSMOS === "true") {
      console.log("Using Cosmos DB (SQL API)");
    } else {
      console.log("Using InMemory database");
    }
  })
  .catch((err) => {
    console.error("Failed to initialize repositories, falling back to InMemory:", err.message);
    // Fallback to InMemory so the app still works
    initRepositories(true).catch(console.error);
  });

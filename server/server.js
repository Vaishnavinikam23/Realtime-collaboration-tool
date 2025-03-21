require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const connectDB = require("./config/db");
const Document = require("./models/Document");

console.log("🔄 Starting Server...");

connectDB(); // ✅ MongoDB Connect

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Import Routes (Fix Duplicate Import Issue)
const authRoutes = require("./routes/authRoutes");
const documentRoutes = require("./routes/documentRoutes");

// ✅ Use Routes
app.use("/api/auth", authRoutes);
app.use("/api/documents", documentRoutes);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // React frontend URL
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.id);

  // ✅ User joins a document
  socket.on("join-document", async (documentId) => {
    socket.join(documentId);
    
    try {
      const document = await Document.findById(documentId);
      socket.emit("load-document", document?.content || "");
    } catch (error) {
      console.error("Error loading document:", error);
    }
  });

  // ✅ Real-time text update
  socket.on("send-text", async ({ documentId, content }) => {
    try {
      socket.to(documentId).emit("receive-text", content);
      await Document.findByIdAndUpdate(documentId, { content });
    } catch (error) {
      console.error("Error updating document:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

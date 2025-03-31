require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const documentRoutes = require("./routes/documentRoutes");
const Document = require("./models/Document");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

// ✅ MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Atlas Connected Successfully!"))
  .catch((err) => console.error("❌ MongoDB Connection Failed: ", err));

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// ✅ API Routes
app.use("/api/auth", authRoutes);
app.use("/api/documents", documentRoutes);

// ✅ Socket.IO for Real-time Collaboration
io.on("connection", (socket) => {
  console.log(`✅ User Connected: ${socket.id}`);

  socket.on("join-document", async (documentId) => {
    socket.join(documentId);
    try {
      const document = await Document.findById(documentId);
      socket.emit("load-document", document ? document.content : "");
    } catch (error) {
      console.error("❌ Error loading document:", error);
    }
  });

  socket.on("update-document", ({ documentId, content }) => {
    socket.to(documentId).emit("document-updated", content);
  });

  socket.on("save-document", async ({ documentId, content }) => {
    try {
      await Document.findByIdAndUpdate(documentId, { content });
      console.log(`✅ Document ${documentId} saved successfully!`);
    } catch (error) {
      console.error("❌ Error saving document:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log(`❌ User Disconnected: ${socket.id}`);
  });
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

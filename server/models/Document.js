const mongoose = require("mongoose");

const DocumentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, default: "" },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // ✅ Document Owner
    collaborators: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, 
        role: { type: String, enum: ["owner", "editor", "viewer"], default: "editor" }, // ✅ Role System
      },
    ],
    fileUrl: { type: String }, // ✅ File Upload Support
  },
  { timestamps: true }
);

module.exports = mongoose.model("Document", DocumentSchema);

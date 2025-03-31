const mongoose = require("mongoose");

const DocumentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, default: "" },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    fileUrl: { type: String, default: null }, // ✅ Optional File URL
    collaborators: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        role: { type: String, enum: ["owner", "editor", "viewer"], required: true },
      },
    ],
  },
  { timestamps: true }
);

// ✅ Prevent Duplicate Collaborators
DocumentSchema.methods.addCollaborator = function (userId, role) {
  const existingCollab = this.collaborators.find((col) => col.user.toString() === userId.toString());
  if (existingCollab) {
    return { error: "User is already a collaborator" };
  }

  this.collaborators.push({ user: userId, role });
  return this.save();
};

module.exports = mongoose.model("Document", DocumentSchema);

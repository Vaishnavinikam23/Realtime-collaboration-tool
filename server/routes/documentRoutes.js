const express = require("express");
const multer = require("multer");
const protect = require("../middleware/authMiddleware"); 
const Document = require("../models/Document");
const User = require("../models/User"); 

const router = express.Router();

// ✅ Multer for File Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// ✅ Create Document (Text-Based)
router.post("/", protect, async (req, res) => {
  try {
    const { title, content = "" } = req.body;
    if (!title || title.trim() === "") {
      return res.status(400).json({ message: "Title is required" });
    }

    const newDocument = new Document({
      title,
      content,
      owner: req.user._id,
    });

    await newDocument.save();
    res.status(201).json(newDocument);
  } catch (error) {
    console.error("Error creating document:", error);
    res.status(500).json({ message: "Error creating document" });
  }
});

// ✅ Save Document (Fix 404 Error)
router.post("/:id/save", protect, async (req, res) => {
  try {
    const { content } = req.body;
    const document = await Document.findById(req.params.id);

    if (!document) return res.status(404).json({ message: "Document not found" });

    // ✅ Check if user is owner or collaborator
    if (
      document.owner.toString() !== req.user._id.toString() &&
      !document.collaborators.some((col) => col.user.toString() === req.user._id.toString())
    ) {
      return res.status(403).json({ message: "Access Denied" });
    }

    document.content = content;
    await document.save();

    res.json({ message: "✅ Document saved successfully!", document });
  } catch (error) {
    console.error("❌ Error saving document:", error);
    res.status(500).json({ message: "Error saving document" });
  }
});

// ✅ Upload File
router.post("/upload", protect, upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const newDocument = new Document({
    title: req.file.originalname,
    fileUrl: `/uploads/${req.file.filename}`,
    owner: req.user._id,
  });

  await newDocument.save();
  res.status(201).json(newDocument);
});

// ✅ Fetch User Documents
router.get("/", protect, async (req, res) => {
  const documents = await Document.find({
    $or: [{ owner: req.user._id }, { "collaborators.user": req.user._id }],
  });

  res.json(documents);
});

// ✅ Get a Single Document (Owner & Collaborators Can Access)
router.get("/:id", protect, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) return res.status(404).json({ message: "Document not found" });

    // ✅ Check if user is owner or collaborator
    if (
      document.owner.toString() !== req.user._id.toString() &&
      !document.collaborators.some((col) => col.user.toString() === req.user._id.toString())
    ) {
      return res.status(403).json({ message: "Access Denied" });
    }

    res.json(document);
  } catch (error) {
    console.error("Error fetching document:", error);
    res.status(500).json({ message: "Error fetching document" });
  }
});

// ✅ Update Document Content (for Real-Time Editing)
router.put("/:id", protect, async (req, res) => {
  try {
    const { content } = req.body;
    const document = await Document.findById(req.params.id);

    if (!document) return res.status(404).json({ message: "Document not found" });

    // ✅ Check if user is owner or collaborator
    if (
      document.owner.toString() !== req.user._id.toString() &&
      !document.collaborators.some((col) => col.user.toString() === req.user._id.toString())
    ) {
      return res.status(403).json({ message: "Access Denied" });
    }

    document.content = content;
    await document.save();

    res.json({ message: "Document updated", document });
  } catch (error) {
    console.error("Error updating document:", error);
    res.status(500).json({ message: "Error updating document" });
  }
});

// ✅ Share Document API
router.post("/:id/share", protect, async (req, res) => {
  try {
    const { email, role } = req.body;
    const document = await Document.findById(req.params.id);

    if (!document) return res.status(404).json({ message: "Document not found" });

    // ✅ Only owner can add collaborators
    if (document.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the owner can share this document" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // ✅ Add user to collaborators if not already added
    const existingCollaborator = document.collaborators.find(
      (col) => col.user.toString() === user._id.toString()
    );

    if (!existingCollaborator) {
      document.collaborators.push({ user: user._id, role });
      await document.save();
    } else {
      return res.status(400).json({ message: "User is already a collaborator" });
    }

    res.json({ message: "User added as collaborator", document });
  } catch (error) {
    console.error("Error adding collaborator:", error);
    res.status(500).json({ message: "Error adding collaborator" });
  }
});

// ✅ Delete Document
router.delete("/:id", protect, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    // ✅ Check if the logged-in user is the owner
    if (document.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "❌ You are not authorized to delete this document" });
    }

    await Document.findByIdAndDelete(req.params.id);
    res.json({ message: "✅ Document deleted successfully!" });
  } catch (error) {
    console.error("❌ Error deleting document:", error);
    res.status(500).json({ message: "Error deleting document" });
  }
});
module.exports = router;

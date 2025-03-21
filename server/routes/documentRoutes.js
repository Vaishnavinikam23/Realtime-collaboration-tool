const express = require("express");
const multer = require("multer");
const path = require("path");
const Document = require("../models/Document");
const User = require("../models/User"); 
const protect = require("../middleware/authMiddleware"); 
const router = express.Router();

// ✅ Middleware to Check Permissions
const checkPermission = (requiredRole) => {
  return async (req, res, next) => {
    const document = await Document.findById(req.params.id);
    if (!document) return res.status(404).json({ message: "Document not found" });

    if (document.owner.toString() === req.user._id.toString()) return next(); 

    const collaborator = document.collaborators.find(
      (col) => col.user.toString() === req.user._id.toString()
    );

    if (!collaborator || (requiredRole === "editor" && collaborator.role === "viewer")) {
      return res.status(403).json({ message: "Permission denied" });
    }

    next();
  };
};

// ✅ Multer Storage for File Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); 
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// ✅ 1️⃣ Upload Document File
router.post("/upload", protect, upload.single("file"), async (req, res) => {
  try {
    const newDoc = await Document.create({
      title: req.file.originalname,
      owner: req.user._id,
      fileUrl: `/uploads/${req.file.filename}`,
    });

    res.status(201).json(newDoc);
  } catch (error) {
    res.status(500).json({ message: "Error uploading document" });
  }
});

// ✅ 2️⃣ Get All Documents (Owner + Shared Docs)
router.get("/", protect, async (req, res) => {
  try {
    const documents = await Document.find({
      $or: [{ owner: req.user._id }, { "collaborators.user": req.user._id }],
    });
    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: "Error fetching documents" });
  }
});

// ✅ 3️⃣ Share Document (Only Owner Can Share)
router.post("/:id/share", protect, async (req, res) => {
  try {
    const { email, role } = req.body;
    const document = await Document.findById(req.params.id);

    if (!document) return res.status(404).json({ message: "Document not found" });

    if (document.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only owner can share document" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    document.collaborators.push({ user: user._id, role });
    await document.save();
    res.json({ message: "User added as collaborator", document });
  } catch (error) {
    res.status(500).json({ message: "Error adding collaborator" });
  }
});

// ✅ 4️⃣ Get a Single Document (Only Owner or Collaborators)
router.get("/:id", protect, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) return res.status(404).json({ message: "Document not found" });

    if (
      document.owner.toString() !== req.user._id.toString() &&
      !document.collaborators.some((col) => col.user.toString() === req.user._id.toString())
    ) {
      return res.status(403).json({ message: "Access Denied" });
    }

    res.json(document);
  } catch (error) {
    res.status(500).json({ message: "Error fetching document" });
  }
});

// ✅ 5️⃣ Update Document (Only Owner & Editor)
router.put("/:id", protect, checkPermission("editor"), async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) return res.status(404).json({ message: "Document not found" });

    document.content = req.body.content || document.content;
    await document.save();
    res.json(document);
  } catch (error) {
    res.status(500).json({ message: "Error updating document" });
  }
});

// ✅ 6️⃣ Delete Document (Only Owner)
router.delete("/:id", protect, checkPermission("owner"), async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) return res.status(404).json({ message: "Document not found" });

    await document.deleteOne();
    res.json({ message: "Document deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting document" });
  }
});

// ✅ Serve Uploaded Files
router.use("/uploads", express.static("uploads"));

module.exports = router;



const Document = require("../models/Document");

exports.getDocument = async (req, res) => {
  const { id } = req.params;
  const document = await Document.findById(id);
  if (!document) return res.status(404).json({ error: "Document Not Found ❌" });

  res.json(document);
};

exports.updateDocument = async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  const document = await Document.findByIdAndUpdate(id, { content, lastUpdated: Date.now() }, { new: true });

  res.json(document);
};

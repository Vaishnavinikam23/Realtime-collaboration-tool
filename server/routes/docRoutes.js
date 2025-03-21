const express = require("express");
const { getDocument, updateDocument } = require("../controllers/docController");
const router = express.Router();

router.get("/:id", getDocument);
router.put("/:id", updateDocument);

module.exports = router;

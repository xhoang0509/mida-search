const express = require("express");
const router = express.Router();
const SessionController = require("../controllers/session.controller");

router.get("/", SessionController.findAll);
router.get("/:id", SessionController.findOne);

module.exports = router;

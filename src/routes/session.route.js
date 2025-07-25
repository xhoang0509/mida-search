const express = require("express");
const router = express.Router();
const SessionController = require("../controllers/session.controller");

router.post("/", SessionController.findAll);

module.exports = router;

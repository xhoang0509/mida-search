const routes = require("express").Router();
const sessionRoute = require("./session.route");

routes.use("/session", sessionRoute);

module.exports = routes;

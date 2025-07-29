require("module-alias/register");
require("dotenv").config();
const express = require("express");
const app = express();
const port = process.env.PORT || 7777;
const ElasticService = require("./services/elastic.service");
const SessionService = require("./services/session.service");
const VisitorService = require("./services/visitor.service");
const PageviewService = require("./services/pageview.service");
const routes = require("./routes");
const cors = require("cors");
const { initRabbitMQ } = require("./queues");

app.use(cors("*"));
app.use(express.json());
app.use("/", routes);

app.listen(port, async () => {
    require("./config/elastic.config");
    await initRabbitMQ();
    console.log(`App is running on post ${port} 🚀️`);

    // await SessionService.createIndex();
    // await SessionService.insertDocument();
    // await VisitorService.createIndex();
    // await VisitorService.insertDocument();

    // await PageviewService.createIndex();
    // await PageviewService.insertDocument();
});

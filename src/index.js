require("module-alias/register");
require("dotenv").config();
const express = require("express");
const app = express();
const port = process.env.PORT || 7777;

const routes = require("./routes");
const cors = require("cors");
const { initRabbitMQ } = require("./queues");
const ElkService = require("./services/elk.service");

app.use(cors("*"));
app.use(express.json());
app.use("/", routes);

app.listen(port, async () => {
    require("./config/elastic.config");
    await initRabbitMQ();
    console.log(`App is running on post ${port} 🚀️`);

    // Init ElasticSearch Indexes
    await ElkService.initIndexes();
});

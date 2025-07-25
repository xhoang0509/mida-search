const express = require("express");
const app = express();
const port = 7777;
const ElasticService = require("./services/elastic.service");
const SessionService = require("./services/session.service");
const VisitorService = require("./services/visitor.service");
const PageviewService = require("./services/pageview.service");
const routes = require("./routes");
const { Types } = require("mongoose");
app.use("/", routes);

app.listen(port, async () => {
    require("./config/elastic.config");
    console.log(`Example app listening on port ${port}`);

    // await SessionService.createIndex();
    // await SessionService.insertDocument();
    // await VisitorService.createIndex();
    // await VisitorService.insertDocument();

    await PageviewService.createIndex();
    await PageviewService.insertDocument();
});

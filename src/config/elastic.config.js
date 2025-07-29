const logger = require("@/logger");
const { Client } = require("@elastic/elasticsearch");

const { ELK_URI, ELK_USER, ELK_PASSWORD } = process.env;
const elasticClient = new Client({
    node: ELK_URI || "http://localhost:9200",
    disableProductCheck: true,
    auth: { username: ELK_USER, password: ELK_PASSWORD },
});

elasticClient
    .ping()
    .then(() => {
        logger.info(__filename, "APP", "Elasticsearch connected");
    })
    .catch((err) => {
        logger.error(__filename, "APP", "Elasticsearch connection error: " + err.message);
    });

module.exports = elasticClient;

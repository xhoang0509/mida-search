const { Client } = require("@elastic/elasticsearch");

const elasticClient = new Client({
    node: "http://localhost:9200",
    disableProductCheck: true,
    auth: { username: "elastic", password: "elastic123" },
});

elasticClient.ping().then(() => {
    console.log("Elasticsearch connected");
});

module.exports = elasticClient;

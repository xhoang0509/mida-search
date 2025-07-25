const elasticClient = require("../config/elastic.config");

const ElasticService = {
    health: async () => {
        return await elasticClient.cluster.health();
    },
    // indexes
    createIndex: async (indexName, mapping) => {
        return await elasticClient.indices.create({
            index: indexName,
            body: mapping,
        });
    },
    deleteIndex: async (indexName) => {
        return await elasticClient.indices.delete({
            index: indexName,
        });
    },
    getIndex: async (indexName) => {
        return await elasticClient.indices.get({
            index: indexName,
        });
    },
    getIndexMapping: async (indexName) => {
        return await elasticClient.indices.getMapping({
            index: indexName,
        });
    },
    getIndexSettings: async (indexName) => {
        return await elasticClient.indices.getSettings({
            index: indexName,
        });
    },
    // insert document
    insertDocument: async (indexName,id,  document) => {
        return await elasticClient.index({
            index: indexName,
            id: id,
            body: document,
        });
    },
    // search
    search: async (indexName, query) => {
        return await elasticClient.search({
            index: indexName,
            body: query,
        });
    },
    bulk: async (indexName, documents) => {
        return await elasticClient.bulk({
            index: indexName,
            body: documents,
        });
    },
    // update
};

module.exports = ElasticService;

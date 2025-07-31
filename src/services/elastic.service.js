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
    indexExists: async (indexName) => {
        return await elasticClient.indices.exists({
            index: indexName,
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
    // Document
    insertDocument: async (indexName, id, document) => {
        return await elasticClient.index({
            index: indexName,
            id: id,
            body: document,
        });
    },
    bulkInsert: async (indexName, documents) => {
        const body = documents.flatMap((doc) => {
            const { _id, ...rest } = doc;
            return [{ index: { _index: indexName, _id } }, rest];
        });
        return await elasticClient.bulk({ body });
    },
    updateDocument: async (indexName, id, document) => {
        return await elasticClient.update({
            index: indexName,
            id: id,
            body: {
                doc: document,
                doc_as_upsert: true,
            },
        });
    },
    increaseField: async (indexName, id, field, value) => {
        return await elasticClient.update({
            index: indexName,
            id: id,
            body: {
                script: {
                    source: `if (ctx._source.${field} == null) { ctx._source.${field} = params.value } else { ctx._source.${field} += params.value }`,
                    lang: "painless",
                    params: {
                        value: value,
                    },
                },
                upsert: {
                    [field]: value,
                },
            },
        });
    },
    deleteDocument: async (indexName, id) => {
        return await elasticClient.delete({
            index: indexName,
            id: id,
        });
    },
    deleteDocumentByQuery: async (indexName, query) => {
        return await elasticClient.deleteByQuery({
            index: indexName,
            body: query,
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

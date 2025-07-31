const fs = require("fs");
const path = require("path");
const logger = require("@/logger");
const { cwd } = require("process");
const { chain } = require("stream-chain");
const { parser } = require("stream-json");
const { streamArray } = require("stream-json/streamers/StreamArray");
const ElasticService = require("./elastic.service");
const VisitorHelper = require("@/helpers/visitor.helper");
const { ElasticQuery } = require("@/helpers/elastic.helper");
const filePath = path.join(cwd(), "./src/static_mongo/mida_srr.visitors.json");

const pipeline = chain([fs.createReadStream(filePath), parser(), streamArray()]);

const VisitorService = {
    createIndex: async () => {
        const mapping = {
            mappings: {
                properties: {
                    key: { type: "keyword" },
                    os: { type: "keyword" },
                    device: { type: "keyword" },
                    browser: { type: "keyword" },
                    location: { type: "keyword" },
                    address: { type: "object" },
                    ips: { type: "ip" },
                    active: { type: "boolean" },
                    lastActive: { type: "date" },
                    display_id: { type: "integer" },
                    display_name: { type: "keyword" },
                    visit_number: { type: "integer" },
                    shop: { type: "keyword" },
                    createdAt: { type: "date" },
                    updatedAt: { type: "date" },
                },
            },
        };
        try {
            // check index exists
            const exists = await ElasticService.indexExists("visitor");
            if (exists?.body) {
                console.log("Index 'visitor' already exists.");
                return;
            }
            await ElasticService.createIndex("visitor", mapping);
            console.log("Index 'visitor' created successfully.");
        } catch (error) {
            console.log(error?.meta?.body?.error?.type);
        }
    },
    insert: async (data) => {
        const id = data._id;
        delete data._id;

        await ElasticService.insertDocument("visitor", id, data)
            .catch((err) => {
                logger.error(__filename, "APP", `Error while inserting visitor: ${err?.meta?.body?.error?.type}`);
            })
            .then((body) => {});
    },
    updateDocument: async (id, data) => {
        if (!id || !data) return;

        delete data._id;
        await ElasticService.updateDocument("visitor", id, data)
            .catch((err) => {
                logger.error(__filename, "APP", `Error while updating visitor: ${err?.meta?.body?.error?.type}`);
            })
            .then((body) => {});
    },
    deleteDocById: async (id) => {
        await ElasticService.deleteDocument("visitor", id)
            .catch((err) => {
                console.log(err);
                logger.error(__filename, "APP", `Error while deleting visitor: ${err?.meta?.body?.error?.type}`);
            })
            .then((body) => {});
    },
    deleteDocByQuery: async (query) => {
        await ElasticService.deleteDocumentByQuery("visitor", query)
            .catch((err) => {
                logger.error(__filename, "APP", `Error while deleting visitor: ${err?.meta?.body?.error?.type}`);
            })
            .then((body) => {});
    },
    insertDocument: async () => {
        let count = 0;
        pipeline.on("data", async ({ value }) => {
            count++;
            if (count < 200000000) {
                if (count % 1000 === 0) {
                    console.log(`Processing visitor ${count}`);
                }

                const id = value._id["$oid"];
                const visitor_insert = {
                    ...value,
                    createdAt: value.createdAt["$date"],
                    updatedAt: value.updatedAt["$date"],
                    shop: value.shop["$oid"],
                    lastActive: value?.lastActive ? value.lastActive["$date"] : value.createdAt["$date"],
                };
                delete visitor_insert._id;
                await ElasticService.insertDocument("visitor", id, visitor_insert)
                    .catch((err) => {
                        console.log(err.meta.body.error);
                    })
                    .then((body) => {
                        // console.log(body.meta);
                    });
            }
        });

        pipeline.on("end", () => {
            console.log(`✅ Done. Total visitors: ${count}`);
        });

        pipeline.on("error", (err) => {
            console.error("❌ Error while parsing:", err);
        });
    },
    bulkInsert: async (data) => {
        try {
            await ElasticService.bulkInsert("visitor", data);
        } catch (error) {
            logger.error(__filename, "APP", `Error while bulk inserting visitor: ${error.message}`);
        }
    },
    query: async ({ shopId, filter }) => {
        const query = VisitorHelper.build(filter, shopId);
        const body = {
            track_total_hits: true,
            _source: ["session"],
            size: 0,
            query: query,
            aggs: {
                unique_ids: {
                    scripted_metric: {
                        init_script: "state.ids = new HashSet();",
                        map_script: "state.ids.add(doc['_id'].value);",
                        combine_script: "return state.ids;",
                        reduce_script: "Set all = new HashSet(); for (s in states) { all.addAll(s); } return all;",
                    },
                },
            },
        };

        const result = await ElasticService.search("visitor", body);
        return result;
    },
    queryDocument: async ({ shopId, filter }) => {
        const body = {
            track_total_hits: true,
            query: {
                bool: {
                    must: [ElasticQuery.term("shop", shopId), ElasticQuery.terms("_id", filter.ids)],
                },
            },
        };

        return await ElasticService.search("visitor", body);
    },
};

module.exports = VisitorService;

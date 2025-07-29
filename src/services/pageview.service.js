const fs = require("fs");
const path = require("path");
const { cwd } = require("process");
const { chain } = require("stream-chain");
const { parser } = require("stream-json");
const { streamArray } = require("stream-json/streamers/StreamArray");
const ElasticService = require("./elastic.service");
const PageviewHelper = require("@/helpers/pageview.helper");
const filePath = path.join(cwd(), "./src/static_mongo/mida_srr.pageviews.json");

const pipeline = chain([fs.createReadStream(filePath), parser(), streamArray()]);

const PageviewService = {
    createIndex: async () => {
        const mapping = {
            mappings: {
                properties: {
                    href: { type: "keyword" },
                    status: { type: "boolean" },
                    key: { type: "keyword" },
                    width: { type: "integer" },
                    height: { type: "integer" },
                    tags: { type: "keyword" },
                    viewed: { type: "boolean" },
                    shop: { type: "keyword" },
                    session: { type: "keyword" },
                    page: { type: "keyword" },
                    start_time: { type: "long" },
                    createdAt: { type: "date" },
                    updatedAt: { type: "date" },
                },
            },
        };
        try {
            await ElasticService.createIndex("pageview", mapping);
        } catch (error) {
            console.log(error?.meta?.body?.error?.type);
        }
    },
    insert: async (data) => {
        const id = data._id;
        delete data._id;

        await ElasticService.insertDocument("pageview", id, data)
            .catch((err) => {
                logger.error(__filename, "APP", `Error while inserting pageview: ${err.meta.body.error.type}`);
            })
            .then((body) => {
                // console.log(JSON.stringify(body, null, 2));
            });
    },
    updateDocument: async (id, data) => {
        if (!id || !data) return;

        await ElasticService.updateDocument("pageview", id, data)
            .catch((err) => {
                console.log(err.meta.body.error);
                logger.error(__filename, "APP", `Error while updating pageview: ${err.meta.body.error.type}`);
            })
            .then((body) => {});
    },
    deleteDocument: async (id) => {
        await ElasticService.deleteDocument("pageview", id)
            .catch((err) => {
                logger.error(__filename, "APP", `Error while deleting pageview: ${err.meta.body.error.type}`);
            })
            .then((body) => {});
    },
    insertDocument: async () => {
        let count = 0;
        pipeline.on("data", async ({ value }) => {
            count++;
            if (count < 100000000) {
                if (count % 1000 === 0) {
                    console.log(`Processing pageview ${count}`);
                }
                const id = value._id["$oid"];
                const pageview_insert = {
                    ...value,
                    shop: value.shop["$oid"],
                    session: value.session["$oid"],
                    page: value.page["$oid"],
                    start_time: value.start_time ? parseInt(value.start_time) : 0,
                    createdAt: value.createdAt["$date"],
                    updatedAt: value.updatedAt["$date"],
                };
                delete pageview_insert._id;
                await ElasticService.insertDocument("pageview", id, pageview_insert)
                    .catch((err) => {
                        console.log(err.meta.body.error);
                    })
                    .then((body) => {
                        // console.log(body.meta);
                    });
            }
        });

        pipeline.on("end", () => {
            console.log(`✅ Done. Total pageviews: ${count}`);
        });

        pipeline.on("error", (err) => {
            console.error("❌ Error while parsing:", err);
        });
    },
    query: async ({ shopId, filter, sessionFilter }) => {
        const elk_query = PageviewHelper.build(filter, sessionFilter, shopId);
        console.log(JSON.stringify(elk_query));
        const body = {
            track_total_hits: true,
            _source: ["session"],
            size: 0,
            query: elk_query,
            aggs: {
                unique_sessions: {
                    terms: {
                        field: "session",
                        size: 10000,
                    },
                },
            },
        };
        const result = await ElasticService.search("pageview", body);
        return result;
    },
};

module.exports = PageviewService;

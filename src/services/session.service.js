const fs = require("fs");
const path = require("path");
const { cwd } = require("process");
const { chain } = require("stream-chain");
const { parser } = require("stream-json");
const { streamArray } = require("stream-json/streamers/StreamArray");
const logger = require("@/logger");
const ElasticService = require("./elastic.service");
const SessionQueryBuilder = require("@/helpers/session.helper");
const filePath = path.join(cwd(), "./src/static_mongo/mida_srr.sessions.json");

const pipeline = chain([fs.createReadStream(filePath), parser(), streamArray()]);

const SessionService = {
    createIndex: async () => {
        const mapping = {
            mappings: {
                properties: {
                    key: { type: "keyword" },
                    viewed: { type: "boolean" },
                    os: { type: "keyword" },
                    device: { type: "keyword" },
                    browser: { type: "keyword" },
                    location: { type: "keyword" },
                    address: { type: "object" },
                    ip: { type: "keyword" },
                    tags: { type: "object" },
                    customer_id: { type: "keyword" },
                    customer_email: { type: "keyword" },
                    type: { type: "keyword" },
                    theme_id: { type: "keyword" },
                    last_funnel: { type: "object" },
                    shop: { type: "keyword" },
                    visitor: { type: "keyword" },
                    duration: { type: "float" },
                    active_duration: { type: "float" },
                    start_time: { type: "date" },
                    last_active: { type: "date" },
                    status: { type: "boolean" },
                    mark_as_favorite: { type: "boolean" },
                    frustrated: { type: "boolean" },
                    source: { type: "object" },
                    cart_value: { type: "object" },
                    visit_number: { type: "integer" },
                    relevance_score: { type: "float" },
                    page_per_session: { type: "integer" },
                    exit_page: {
                        type: "text",
                        fields: {
                            keyword: {
                                type: "keyword",
                            },
                        },
                    },
                    events: { type: "keyword" },
                    orders: { type: "keyword" },
                    createdAt: { type: "date" },
                    updatedAt: { type: "date" },
                },
            },
        };
        try {
            // check index exists
            const exists = await ElasticService.indexExists("session");
            if (exists?.body) {
                console.log("Index 'session' already exists.");
                return;
            }
            await ElasticService.createIndex("session", mapping);
            console.log("Index 'session' created successfully.");
        } catch (error) {
            console.log(error);
        }
    },
    insert: async (data) => {
        const id = data._id;
        delete data._id;

        await ElasticService.insertDocument("session", id, data)
            .catch((err) => {
                console.log(err.meta.body.error);
                logger.error(__filename, "APP", `Error while inserting session: ${err.meta.body.error.type}`);
            })
            .then((body) => {
                // console.log(JSON.stringify(body, null, 2));
            });
    },
    updateDocument: async (id, data) => {
        if (!id || !data) return;

        const body = data.$set;
        if (data?.$inc?.relevance_score) {
            await ElasticService.increaseField("session", id, "relevance_score", data?.$inc?.relevance_score)
                .catch((err) => {
                    console.log(err.meta.body.error);
                    logger.error(__filename, "APP", `Error while updating session: ${err.meta.body.error.type}`);
                })
                .then((body) => {});
        }
        await ElasticService.updateDocument("session", id, body)
            .catch((err) => {
                console.log(err.meta.body.error);
                logger.error(__filename, "APP", `Error while updating session: ${err.meta.body.error.type}`);
            })
            .then((body) => {});
    },
    deleteDocById: async (id) => {
        await ElasticService.deleteDocument("session", id)
            .catch((err) => {
                console.log(JSON.stringify(err.meta.body, null, 2));
                logger.error(__filename, "APP", `Error while deleting session: ${err.meta.body.error?.type}`);
            })
            .then((data) => {
                if (data?.body?.deleted) {
                    console.log(`Deleted ${data?.body?.deleted} sessions`);
                }
            });
    },
    deleteDocByQuery: async (query) => {
        await ElasticService.deleteDocumentByQuery("session", query)
            .catch((err) => {
                logger.error(__filename, "APP", `Error while deleting session: ${err.meta.body.error?.type}`);
            })
            .then((data) => {
                if (data?.body?.deleted) {
                    console.log(`Deleted ${data?.body?.deleted} sessions`);
                }
            });
    },
    insertDocument: async () => {
        let count = 0;
        pipeline.on("data", async ({ value }) => {
            count++;
            if (count < 1000000000) {
                if (count % 1000 === 0) {
                    console.log(`Processing session ${count}`);
                }
                const id = value._id["$oid"];
                const session_insert = {
                    ...value,
                    createdAt: value.createdAt["$date"],
                    updatedAt: value.updatedAt["$date"],
                    shop: value.shop["$oid"],
                    visitor: value.visitor["$oid"],
                    last_active: value?.last_active ? value.last_active["$date"] : null,
                };
                delete session_insert._id;

                await ElasticService.insertDocument("session", id, session_insert)
                    .catch((err) => {
                        console.log(err.meta.body.error.type);
                    })
                    .then((body) => {
                        // console.log(body.meta);
                    });
            }
        });

        pipeline.on("end", () => {
            console.log(`✅ Done. Total sessions: ${count}`);
        });

        pipeline.on("error", (err) => {
            console.error("❌ Error while parsing:", err);
        });
    },
    bulkInsert: async (data) => {
        try {
            await ElasticService.bulkInsert("session", data);
        } catch (error) {
            logger.error(__filename, "APP", `Error while bulk inserting session: ${error.message}`);
        }
    },
    query: async ({ shopId, filter, limit, skip }) => {
        const query = SessionQueryBuilder.build(filter, shopId);

        const body = {
            track_total_hits: true,
            from: skip,
            size: limit,
            sort: [{ last_active: { order: "desc" } }],
            query: query,
        };
        const result = await ElasticService.search("session", body);
        if (result?.body) {
            const totalDocs = result?.body?.hits?.total?.value;
            const totalPages = Math.ceil(totalDocs / limit);
            const currentPage = Math.floor(skip / limit) + 1;

            let visitor_ids = result?.body?.hits?.hits?.map((hit) => hit._source?.visitor);
            visitor_ids = [...new Set(visitor_ids)];
            return {
                ...result?.body,
                pagination: {
                    total: totalDocs,
                    totalPages: totalPages,
                    currentPage: currentPage,
                    limit: limit,
                    skip: skip,
                },
                visitor_ids: visitor_ids,
            };
        }
        return {
            hits: { hits: [], total: { value: 0 } },
            pagination: {
                total: 0,
                totalPages: 0,
                currentPage: 1,
                limit: limit,
                skip: skip,
            },
        };
    },
};

module.exports = SessionService;

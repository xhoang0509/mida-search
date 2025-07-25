const fs = require("fs");
const path = require("path");
const { cwd } = require("process");
const { chain } = require("stream-chain");
const { parser } = require("stream-json");
const { streamArray } = require("stream-json/streamers/StreamArray");
const ElasticService = require("./elastic.service");
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
                    tags: { type: "keyword" },
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
                    exit_page: { type: "keyword" },
                    events: { type: "object" },
                    orders: { type: "object" },
                    createdAt: { type: "date" },
                    updatedAt: { type: "date" },
                },
            },
        };
        try {
            await ElasticService.createIndex("session", mapping);
        } catch (error) {
            console.log(error?.meta?.body?.error?.type);
        }
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
};

module.exports = SessionService;

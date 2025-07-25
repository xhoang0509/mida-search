const fs = require("fs");
const path = require("path");
const { cwd } = require("process");
const { chain } = require("stream-chain");
const { parser } = require("stream-json");
const { streamArray } = require("stream-json/streamers/StreamArray");
const ElasticService = require("./elastic.service");
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
                    visit_number: { type: "integer" },
                    shop: { type: "keyword" },
                    createdAt: { type: "date" },
                    updatedAt: { type: "date" },
                },
            },
        };
        try {
            await ElasticService.createIndex("visitor", mapping);
        } catch (error) {
            console.log(error?.meta?.body?.error?.type);
        }
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
    query: async (query) => {
        const result = await ElasticService.search("visitor", query);
        return result;
    },
};

module.exports = VisitorService;

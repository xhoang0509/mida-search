const fs = require("fs");
const path = require("path");
const { cwd } = require("process");
const { chain } = require("stream-chain");
const { parser } = require("stream-json");
const { streamArray } = require("stream-json/streamers/StreamArray");
const ElasticService = require("./elastic.service");
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
};

module.exports = PageviewService;

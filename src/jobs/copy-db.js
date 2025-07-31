const logger = require("@/logger");
const SessionService = require("@/services/session.service");
const VisitorService = require("@/services/visitor.service");
const PageviewService = require("@/services/pageview.service");
const { MongoClient } = require("mongodb");

const client = new MongoClient(process.env.MONGO_URI);
const dbName = process.env.MONGO_DB_NAME || "mida_srr";
const copyDatabase = async () => {
    try {
        console.log("Copying database");
        require("@/config/elastic.config");
        await client.connect().then(() => {
            console.log("Connected to MongoDB");
        });
        const db = client.db(dbName);

        await findWithCursor(db, "sessions", 10000);
        // await findWithCursor(db, "visitors", 10000);
        // await findWithCursor(db, "pageviews", 10000);
    } catch (error) {
        logger.error(__filename, "APP", `Error while copying database: ${error.message}`);
    }
};

const findWithCursor = async (db, collectionName, batchSize = 1000) => {
    try {
        const collection = db.collection(collectionName);
        const cursor = collection.find({}).batchSize(batchSize);

        let batch = [];
        let total = 0;
        let batchCount = 0;

        for await (const doc of cursor) {
            batch.push(doc);

            if (batch.length >= batchSize) {
                await processBatch(collectionName, batch, ++batchCount);
                total += batch.length;
                batch = [];
            }
        }

        if (batch.length > 0) {
            await processBatch(collectionName, batch, ++batchCount);
            total += batch.length;
        }

        console.log(`✅ Total documents processed: ${total}`);
    } catch (error) {
        logger.error(__filename, "APP", `Error while finding with cursor: ${error.message}`);
    }
};

const processBatch = async (collectionName, batch, batchIndex) => {
    console.log(`🔹 Processing batch ${batchIndex}, size: ${batchIndex * batch.length}, collection: ${collectionName}`);
    if (collectionName === "sessions") {
        await SessionService.bulkInsert(batch);
    } else if (collectionName === "visitors") {
        await VisitorService.bulkInsert(batch);
    } else if (collectionName === "pageviews") {
        await PageviewService.bulkInsert(batch);
    }
};

module.exports = copyDatabase;

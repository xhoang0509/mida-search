const logger = require("@/logger");
const BackupConsume = require("../consumes/backup.consume");

const BackupChannel = (function () {
    let channel;
    const EXCHANGE_NAME = "backup_mongo_db";
    const queueNames = ["backup_pageview", "backup_session", "backup_visitor"];

    const initial = async (conn) => {
        try {
            channel = await conn.createChannel();

            await channel.assertExchange(EXCHANGE_NAME, "direct", { durable: true });
            channel.prefetch(10);

            for (const name of queueNames) {
                await channel.assertQueue(name, { durable: true });
                await channel.bindQueue(name, EXCHANGE_NAME, name);
                await channel.consume(name, (message) => BackupConsume[name](channel, message));
            }
        } catch (e) {
            logger.error(__filename, "", `Channel point: ${e.toString()}`);
        }
    };

    const publish = async (queue, message) => {
        const messageBuffer = Buffer.from(JSON.stringify(message));
        if (channel) {
            await channel.publish(EXCHANGE_NAME, queue, messageBuffer, { persistent: true });
        }
    };

    return {
        initial,
        publish,
    };
})();

module.exports = BackupChannel;

const logger = require("@/logger");
const amqp = require("amqplib");
const BackupChannel = require("./channels/backup.channel");
const AMQP_URI = `amqp://${process.env.AMQP_URI}`;

const createRabbitMQConnector = () => {
    let connection;

    const initRabbitMQ = async () => {
        try {
            connection = await amqp.connect(AMQP_URI);
            BackupChannel.initial(connection);

            logger.info(__filename, "", `AMQP: connection established`);

            connection.on("error", (err) => {
                logger.error(__filename, "", `AMQP: connection error - ${err.message}`);
                reconnectRabbitMQ();
            });

            connection.on("close", () => {
                logger.error(__filename, "", "AMQP: connection closed");
                reconnectRabbitMQ();
            });
        } catch (e) {
            logger.error(__filename, "", `AMQP: connection failed - ${e.toString()}`);
            reconnectRabbitMQ();
        }
    };

    const reconnectRabbitMQ = () => {
        logger.info(__filename, "", "AMQP: attempting to reconnect in 10 seconds...");
        setTimeout(initRabbitMQ, 10000);
    };

    return {
        initRabbitMQ,
    };
};

const initRabbitMQ = createRabbitMQConnector();
module.exports = initRabbitMQ;

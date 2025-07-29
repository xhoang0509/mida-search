const { error } = require("@/logger");
const SessionService = require("@/services/session.service");
const VisitorService = require("@/services/visitor.service");
const PageviewService = require("@/services/pageview.service");

const BackupConsume = {
    backup_session: async (channel, message) => {
        try {
            const { event, data } = JSON.parse(message.content.toString());

            switch (event) {
                case "save": {
                    if (data) {
                        await SessionService.insert(data);
                    }
                    break;
                }
                case "update": {
                    const { _conditions, _update } = data;
                    if (_conditions?._id) {
                        await SessionService.updateDocument(_conditions._id, _update?.$set);
                    }
                    break;
                }
                case "deleteOne": {
                    if (data && Object.keys(data).length) {
                        await SessionService.deleteDocument(data._id);
                    }
                    break;
                }
                case "deleteMany": {
                    if (data && Object.keys(data).length) {
                        console.log(data);
                    }
                    break;
                }
                default:
                    error(__filename, "backup_session", `${event} not supported`);
                    break;
            }

            channel.ack(message);
        } catch (e) {
            error(__filename, "backup_session", e);
            channel.nack(message, false, false);
        }
    },
    backup_pageview: async (channel, message) => {
        try {
            const { event, data } = JSON.parse(message.content.toString());
            console.log(51, event, data);
            switch (event) {
                case "save": {
                    if (data) {
                        await PageviewService.insert(data);
                    }
                    break;
                }
                case "updateOne": {
                    const { _conditions, _update } = data;
                    console.log(data);
                    break;
                }
                default:
                    error(__filename, "backup_pageview", `${event} not supported`);
                    break;
            }
            channel.ack(message);
        } catch (e) {
            error(__filename, "backup_pageview", e.message);
            channel.nack(message, false, false);
        }
    },

    backup_visitor: async (channel, message) => {
        try {
            const { event, data } = JSON.parse(message.content.toString());

            switch (event) {
                case "save":
                    if (data) {
                        await VisitorService.insert(data);
                    }
                    break;
                case "update": {
                    const { _conditions, _update } = data;
                    if (_conditions?._id) {
                        await VisitorService.updateDocument(_conditions._id, _update?.$set);
                    }
                    break;
                }
                case "deleteOne": {
                    if (data && Object.keys(data).length) {
                        console.log(data);
                    }
                    break;
                }
                case "deleteMany": {
                    if (data && Object.keys(data).length) {
                        console.log(data);
                    }
                    break;
                }
                default:
                    error(__filename, "backup_visitor", `${event} not supported`);
                    break;
            }

            channel.ack(message);
        } catch (e) {
            error(__filename, "backup_visitor", e.message);
            channel.nack(message, false, false);
        }
    },
};

module.exports = BackupConsume;

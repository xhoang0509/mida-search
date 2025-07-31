const { error } = require("@/logger");
const SessionService = require("@/services/session.service");
const VisitorService = require("@/services/visitor.service");
const PageviewService = require("@/services/pageview.service");
const SessionHelper = require("@/helpers/session.helper");
const PageviewHelper = require("@/helpers/pageview.helper");
const VisitorHelper = require("@/helpers/visitor.helper");

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
                    console.log(22, _conditions, _update);
                    if (_conditions?._id) {
                        await SessionService.updateDocument(_conditions._id, _update);
                    }
                    break;
                }
                case "deleteOne": {
                    if (data && Object.keys(data).length) {
                        if (data?._id && typeof data._id === "string") {
                            await SessionService.deleteDocById(data._id);
                        } else {
                            const query = SessionHelper.buildQueryDelete(data);
                            if (!query) return;
                            await SessionService.deleteDocByQuery(query);
                        }
                    }
                    break;
                }
                case "deleteMany": {
                    if (data && Object.keys(data).length) {
                        if (data?._id && typeof data._id === "string") {
                            await SessionService.deleteDocById(data._id);
                        } else {
                            const query = SessionHelper.buildQueryDelete(data);
                            if (!query) return;
                            await SessionService.deleteDocByQuery(query);
                        }
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

            switch (event) {
                case "save": {
                    if (data) {
                        await PageviewService.insert(data);
                    }
                    break;
                }
                case "updateOne": {
                    const { _conditions, _update } = data;
                    break;
                }
                case "deleteOne": {
                    if (data && Object.keys(data).length) {
                        if (data?._id && typeof data._id === "string") {
                            await PageviewService.deleteDocById(data._id);
                        } else {
                            const query = PageviewHelper.buildQueryDelete(data);
                            if (!query) return;
                            await PageviewService.deleteDocByQuery(query);
                        }
                    }
                    break;
                }
                case "deleteMany": {
                    if (data && Object.keys(data).length) {
                        if (data?._id && typeof data._id === "string") {
                            await PageviewService.deleteDocById(data._id);
                        } else {
                            const query = PageviewHelper.buildQueryDelete(data);
                            if (!query) return;
                            await PageviewService.deleteDocByQuery(query);
                        }
                    }
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
                        if (data?._id && typeof data._id === "string") {
                            await VisitorService.deleteDocById(data._id);
                        } else {
                            const query = VisitorHelper.buildQueryDelete(data);
                            if (!query) return;
                            await VisitorService.deleteDocByQuery(query);
                        }
                    }
                    break;
                }
                case "deleteMany": {
                    if (data && Object.keys(data).length) {
                        if (data?._id && typeof data._id === "string") {
                            await VisitorService.deleteDocById(data._id);
                        } else {
                            const query = VisitorHelper.buildQueryDelete(data);
                            if (!query) return;
                            await VisitorService.deleteDocByQuery(query);
                        }
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

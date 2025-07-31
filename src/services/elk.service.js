const PageviewService = require("./pageview.service");
const SessionService = require("./session.service");
const VisitorService = require("./visitor.service");

const ElkService = {
    initIndexes: async () => {
        await SessionService.createIndex();
        await PageviewService.createIndex();
        await VisitorService.createIndex();
    },
};

module.exports = ElkService;

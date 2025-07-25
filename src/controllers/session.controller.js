const PageviewService = require("../services/pageview.service");
const SessionService = require("../services/session.service");
const VisitorService = require("../services/visitor.service");

const SessionController = {
    findAll: async (req, res) => {
        const body = req.body;
        console.log(body);
        const visitorFilters = body?.visitorFilters;
        const pageviewFilters = body?.pageviewFilters;
        const sessionFilters = body?.sessionFilters;
        const _limit = body._limit;
        const _skip = body._skip;
        const shopId = body.shopId;
        const domain = body.domain;
        let sessions = [];
        if (Object.keys(visitorFilters).length) {
            sessions = await VisitorService.query({
                shopId,
                filter: visitorFilters,
                fPageview: pageviewFilters,
                fSession: sessionFilters,
                limit: _limit,
                skip: _skip,
            });
        } else if (Object.keys(pageviewFilters).length) {
            sessions = await PageviewService.query({
                shopId,
                filter: pageviewFilters,
                fSession: sessionFilters,
                limit: _limit,
                skip: _skip,
            });
        } else {
            sessions = await SessionService.query({
                shopId,
                filter: sessionFilters,
                limit: _limit,
                skip: _skip,
            });
        }
        console.log(sessions);
        res.status(200).json({
            success: true,
            sessions
        });
    },
};

module.exports = SessionController;

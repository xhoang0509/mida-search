const { ElasticHelper } = require("@/helpers/elastic.helper");
const PageviewService = require("@/services/pageview.service");
const SessionService = require("@/services/session.service");
const VisitorService = require("@/services/visitor.service");

const SessionController = {
    findAll: async (req, res) => {
        const body = req.body;
        const visitorFilters = body?.visitorFilters;
        const pageviewFilters = body?.pageviewFilters;
        const sessionFilters = body?.sessionFilters;
        const _limit = body._limit;
        const _skip = body._skip;
        const shopId = body.shopId;

        let sessions = [];
        let visitors = [];
        let pageviews = [];
        let sessionIds = [];
        let visitorIds = [];
        let visitorIdsMap = [];

        console.time("SessionController.findAll");
        if (Object.keys(visitorFilters).length) {
            visitors = await VisitorService.query({
                shopId,
                filter: visitorFilters,
            });
            visitorIds = ElasticHelper.getAggsVisitorIds(visitors?.body);
        } else if (Object.keys(pageviewFilters).length) {
            pageviews = await PageviewService.query({
                shopId,
                filter: pageviewFilters,
                sessionFilter: sessionFilters,
            });
            sessionIds = ElasticHelper.getAggsSessionIds(pageviews?.body);
        } else {
            sessions = await SessionService.query({
                shopId,
                filter: sessionFilters,
                limit: _limit,
                skip: _skip,
            });
            visitorIdsMap = sessions?.visitor_ids;
        }

        if (sessionIds.length) {
            sessionFilters.ids = sessionIds;
            sessions = await SessionService.query({
                shopId,
                filter: sessionFilters,
                limit: _limit,
                skip: _skip,
            });
        }

        // Get visitors from visitorIds
        if (visitorIds.length) {
            visitorFilters.visitor_ids = visitorIds;
            sessions = await SessionService.query({
                shopId,
                filter: visitorFilters,
                limit: _limit,
                skip: _skip,
            });
            visitorIdsMap = sessions?.visitor_ids;
        }

        // Merge visitor into sessions
        let sessionList = [];
        if (visitorIdsMap.length) {
            let visitors = await VisitorService.queryDocument({
                shopId,
                filter: {
                    ids: visitorIdsMap,
                },
            });
            visitors = ElasticHelper.getHits(visitors?.body);
            console.log(visitors,visitorIdsMap );
            sessionList = ElasticHelper.getHits(sessions);
            sessionList = sessionList.map((session) => {
                const visitor = visitors.find((visitor) => visitor._id === session.visitor);
                return {
                    ...session,
                    visitor: visitor ? visitor : session.visitor,
                };
            });
        }
        console.timeEnd("SessionController.findAll");

        res.status(200).json({
            success: true,
            payload: {
                currentPage: sessions?.pagination?.currentPage || 1,
                totalPage: sessions?.pagination?.totalPages || 1,
                sessions: sessionList,
            },
            statusCode: 200,
        });
    },
};

module.exports = SessionController;

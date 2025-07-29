const { ElasticQuery } = require("./elastic.helper");

const VisitorQueryBuilder = {
    build: (filter, shopId) => {
        const elk_must = [
            {
                term: {
                    shop: shopId, //"682e1c58419ef8e4aa521c07", // shopId,
                },
            },
        ];

        const elk_must_not = [];
        const elk_filter = [];
        const elk_should = [];

        if (filter?.$or && filter?.$or?.length) {
            filter.$or.forEach((q) => {
                if (q.display_id && q.display_id?.$in) {
                    elk_must.push(ElasticQuery.terms("display_id", q.display_id.$in));
                }
                if (q.display_name && q.display_name?.$regex) {
                    elk_filter.push(
                        ElasticQuery.regexp("display_name", {
                            value: `.*(${q.display_name?.$regex}).*`,
                            case_insensitive: true,
                        })
                    );
                }
            });
        }

        return {
            bool: {
                must: elk_must,
                ...(elk_must_not.length > 0 && { must_not: elk_must_not }),
                ...(elk_filter.length > 0 && { filter: elk_filter }),
                ...(elk_should.length > 0 && { should: elk_should, minimum_should_match: 1 }),
            },
        };
    },
};

module.exports = { VisitorQueryBuilder };

const { ElasticQuery } = require("./elastic.helper");

const PageviewHelper = {
    build: (filter, sessionFilter, shopId) => {
        const elk_must = [
            {
                term: {
                    shop: shopId, //"682e1c58419ef8e4aa521c07", // shopId,
                },
            },
            {
                range: {
                    createdAt: {
                        gte: sessionFilter.createdAt["$gte"],
                        lte: sessionFilter.createdAt["$lte"],
                    },
                },
            },
        ];
        const elk_must_not = [];
        const elk_filter = [];
        const elk_should = [];

        // href
        if (filter?.href?.$regex) {
            elk_filter.push(
                ElasticQuery.regexp("href", {
                    value: `.*(${filter?.href.$regex}).*`,
                    case_insensitive: true,
                })
            );
        }

        // type
        if (filter?.type) {
            elk_must.push(ElasticQuery.term("type.keyword", filter.type));
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

module.exports = PageviewHelper;

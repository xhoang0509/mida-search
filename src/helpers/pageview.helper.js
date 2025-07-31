const { ElasticQuery } = require("./elastic.helper");

const PageviewHelper = {
    build: (filter, sessionFilter, shopId) => {
        const elk_must = [
            {
                term: {
                    shop: shopId,
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
                ElasticQuery.regexp("href.keyword", {
                    value: `.*(${filter?.href.$regex}).*`,
                    case_insensitive: true,
                })
            );
        }

        // type
        if (filter?.type) {
            elk_must.push(ElasticQuery.term("type", filter.type));
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
    buildQueryDelete: (query) => {
        const elk_must = [];

        if (query?._id?.$in && query?._id?.$in?.length) {
            elk_must.push(ElasticQuery.terms("_id", query._id.$in));
        }

        if (query?.key) {
            elk_must.push(ElasticQuery.term("key", query.key));
        }
        if (query?.shop) {
            elk_must.push(ElasticQuery.term("shop", query.shop));
        }

        if (query?.session) {
            elk_must.push(ElasticQuery.term("session", query.session));
        }

        if (elk_must.length === 0) return null;

        return {
            query: {
                bool: {
                    must: elk_must,
                },
            },
        };
    },
};

module.exports = PageviewHelper;

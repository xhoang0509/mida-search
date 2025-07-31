const { ElasticQuery } = require("./elastic.helper");

const VisitorHelper = {
    build: (filter, shopId) => {
        const elk_must = [
            {
                term: {
                    shop: shopId,
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

module.exports = VisitorHelper;

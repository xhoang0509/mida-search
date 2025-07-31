const { ElasticQuery } = require("./elastic.helper");

const SessionQueryBuilder = {
    _buildRangeConditions: function (filterValue) {
        if (!filterValue || typeof filterValue !== "object") {
            return null;
        }

        const rangeConditions = {};
        const supportedOperators = ["$gte", "$lte", "$gt", "$lt"];

        supportedOperators.forEach((operator) => {
            if (filterValue[operator] !== undefined) {
                const elasticOperator = operator.substring(1); // Remove the '$' prefix
                rangeConditions[elasticOperator] = filterValue[operator];
            }
        });

        return Object.keys(rangeConditions).length > 0 ? rangeConditions : null;
    },

    build: function (filter, shopId) {
        const elk_must = [
            {
                term: {
                    shop: shopId,
                },
            },
            {
                range: {
                    createdAt: {
                        gte: filter.createdAt["$gte"],
                        lte: filter.createdAt["$lte"],
                    },
                },
            },
        ];

        const elk_must_not = [];
        const elk_filter = [];
        const elk_should = [];

        // ids
        if (filter?.ids) {
            elk_must.push(ElasticQuery.terms("_id", filter.ids));
        }

        // visitor_ids
        if (filter?.visitor_ids) {
            elk_must.push(ElasticQuery.terms("visitor", filter.visitor_ids));
        }

        // events
        if (filter?.events) {
            if (filter?.events?.$in) {
                elk_must.push(ElasticQuery.terms("events", filter.events.$in));
            }
            if (filter?.events?.$nin) {
                elk_must_not.push(ElasticQuery.terms("events", filter.events.$nin));
            }
        }

        // duration
        if (filter?.duration) {
            const rangeConditions = this._buildRangeConditions(filter.duration);
            if (rangeConditions) {
                elk_must.push(ElasticQuery.range("duration", rangeConditions));
            }
        }

        // active_duration
        if (filter?.active_duration) {
            const rangeConditions = this._buildRangeConditions(filter.active_duration);
            if (rangeConditions) {
                elk_must.push(ElasticQuery.range("active_duration", rangeConditions));
            }
        }

        // page_per_session
        if (filter?.page_per_session) {
            const rangeConditions = this._buildRangeConditions(filter.page_per_session);
            if (rangeConditions) {
                elk_must.push(ElasticQuery.range("page_per_session", rangeConditions));
            }
        }

        // customer id
        if (filter?.customer_id?.$in) {
            elk_must.push(ElasticQuery.terms("customer_id", filter.customer_id.$in));
        }
        if (filter?.customer_id?.$nin && filter?.customer_id?.$nin.length > 0) {
            elk_must_not.push(ElasticQuery.exists("customer_id"));
        }

        // source type
        if (filter?.["source.type"]?.$in) {
            elk_must.push(ElasticQuery.terms("source.type.keyword", filter["source.type"].$in));
        }

        // source url
        if (filter?.["source.url"] && filter?.["source.url"].$regex) {
            elk_filter.push(
                ElasticQuery.regexp("source.url.keyword", {
                    value: `.*(${filter?.["source.url"].$regex}).*`,
                    case_insensitive: true,
                })
            );
        }

        // exit_page
        if (filter?.exit_page?.$regex) {
            elk_filter.push(
                ElasticQuery.regexp("exit_page.keyword", {
                    value: `.*(${filter?.exit_page?.$regex}).*`,
                    case_insensitive: true,
                })
            );
        }

        // favorite
        if ([true, false].includes(filter?.mark_as_favorite)) {
            elk_must.push(ElasticQuery.term("mark_as_favorite", filter.mark_as_favorite));
        }

        // location
        if (filter?.location?.$in) {
            elk_must.push(ElasticQuery.terms("location", filter.location.$in));
        }

        // IP
        if (filter?.ip?.$in) {
            elk_must.push(ElasticQuery.terms("ip.keyword", filter.ip.$in));
        }

        // visit_number
        if (filter?.visit_number === 1) {
            elk_must.push(ElasticQuery.term("visit_number", 1));
        } else if (filter?.visit_number) {
            const rangeConditions = this._buildRangeConditions(filter.visit_number);
            if (rangeConditions) {
                elk_must.push(ElasticQuery.range("visit_number", rangeConditions));
            }
        }

        // relevance_score
        if (filter?.relevance_score) {
            const rangeConditions = this._buildRangeConditions(filter.relevance_score);
            if (rangeConditions) {
                elk_must.push(ElasticQuery.range("relevance_score", rangeConditions));
            }
        }

        // relevance_score $or
        if (filter?.$or && filter?.$or.length > 0) {
            filter?.$or.forEach((item) => {
                if (item.relevance_score) {
                    const key = Object.keys(item.relevance_score)[0];
                    const value = item.relevance_score[key];
                    const elasticOperator = key.substring(1);
                    elk_should.push(
                        ElasticQuery.range("relevance_score", {
                            [elasticOperator]: value,
                        })
                    );
                }
            });
        }

        // tags
        if (filter?.tags?.$in) {
            elk_must.push(ElasticQuery.terms("tags.keyword", filter.tags.$in));
        }

        // browser
        if (filter?.browser?.$in) {
            elk_must.push(ElasticQuery.terms("browser", filter.browser.$in));
        }

        // device
        if (filter?.device?.$in) {
            elk_must.push(ElasticQuery.terms("device", filter.device.$in));
        }

        // os
        if (filter?.os?.$in) {
            elk_must.push(ElasticQuery.terms("os", filter.os.$in));
        }

        // cart_value
        if (filter?.["cart_value.original_total_price"]) {
            const rangeConditions = this._buildRangeConditions(filter["cart_value.original_total_price"]);
            if (rangeConditions) {
                elk_must.push(ElasticQuery.range("cart_value.original_total_price", rangeConditions));
            }
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

        if (query?.visitor) {
            elk_must.push(ElasticQuery.term("visitor", query.visitor));
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

module.exports = SessionQueryBuilder;

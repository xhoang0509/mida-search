const ElasticQuery = {
    must: (query) => ({
        must: query,
    }),
    must_not: (query) => ({
        must_not: query,
    }),
    should: (query) => ({
        should: query,
    }),
    range: (field, value) => ({
        range: {
            [field]: value,
        },
    }),
    term: (field, value) => ({
        term: {
            [field]: value,
        },
    }),
    terms: (field, value) => ({
        terms: {
            [field]: value,
        },
    }),
    match: (field, value) => ({
        match: {
            [field]: value,
        },
    }),
    matchAll: (query) => ({
        matchAll: query,
    }),
    bool: (query) => ({
        bool: query,
    }),
    regexp: (field, value) => ({
        regexp: {
            [field]: value,
        },
    }),
    exists: (field) => ({
        exists: {
            field: field,
        },
    }),
};

const ElasticHelper = {
    getHits: (data) => {
        if (!data?.hits?.hits) return [];
        return data.hits.hits.map((hit) => {
            return {
                _id: hit._id,
                ...hit._source,
            };
        });
    },
    getTotal: (data) => {
        return data.hits.total.value;
    },
    getPage: (data) => {
        return data.hits.hits.map((hit) => hit._source);
    },
    getAggs: (data) => {
        return data?.aggregations || {};
    },
    getAggsSessionIds: (data) => {
        return data?.aggregations?.unique_sessions?.buckets?.map((bucket) => bucket.key) || [];
    },
    getAggsVisitorIds: (data) => {
        return data?.aggregations?.unique_ids?.value || [];
    },
};

module.exports = { ElasticHelper, ElasticQuery };

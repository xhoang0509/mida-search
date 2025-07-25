const fs = require("fs");
const path = require("path");
const { cwd } = require("process");

const main = async () => {
    const shopPath = path.join(cwd(), "./src/static_mongo/mida_srr.shops.json");
    const shops = JSON.parse(fs.readFileSync(shopPath, "utf8"));

    const new_shops = [];
    for (const shop of shops) {
        delete shop.internal_configs;
        delete shop.scopes;
        delete shop.subscription_info;
        delete shop.metafields;
        const shop_item = {
            ...shop,
            _id: shop._id["$oid"],
            createdAt: shop.createdAt["$date"],
            updatedAt: shop.updatedAt["$date"],
            plan: shop.plan["$oid"],
        };
        new_shops.push(shop_item);
    }

    // write to file
    fs.writeFileSync(path.join(cwd(), "./src/static_mongo/shop.json"), JSON.stringify(new_shops, null, 2));
};

main();

const fs = require("fs");
const path = require("path");
const { cwd } = require("process");
const { Client } = require("@elastic/elasticsearch");

const main = async () => {
    const shopPath = path.join(cwd(), "./src/static_mongo/shop.json");
    const shops = JSON.parse(fs.readFileSync(shopPath, "utf8"));

    // Kết nối tới Elasticsearch
    const client = new Client({ node: "http://localhost:9200", auth: { username: "elastic", password: "elastic123" } });

    // Định nghĩa mapping cho index
    const mapping = {
        mappings: {
            properties: {
                _id: { type: "keyword" }, // Đảm bảo _id là keyword để truy vấn nhanh
                domain: { type: "keyword" }, // domain là keyword để tìm kiếm chính xác
                access_token: { type: "keyword" },
                status: { type: "boolean" },
                createdAt: { type: "date" },
                plan: { type: "keyword" },
                country: { type: "keyword" },
                shopify_plan: { type: "keyword" },
                plan_code: { type: "keyword" },
                email: { type: "keyword" },
                app_name: { type: "keyword" },
                shop_name: { type: "text" }, // Có thể để text nếu cần tìm kiếm full-text
                first_name: { type: "text" },
                last_name: { type: "text" },
                pricing_type: { type: "integer" },
                extra_quota: { type: "integer" },
                session_count: { type: "integer" },
                version_plan: { type: "keyword" },
            },
        },
    };

    // Tạo index với mapping (xóa index cũ nếu cần)
    try {
        await client.indices.delete({ index: "shop", ignore_unavailable: true });
        await client.indices.create({ index: "shop", body: mapping });
        console.log("Index 'shop' created with custom mapping.");
    } catch (error) {
        console.error("Error creating index:", error);
    }

    // Chèn dữ liệu vào Elasticsearch
    for (const shop of shops) {
        const shop_insert = {
            domain: shop.domain,
            access_token: shop.access_token,
            status: shop.status,
            createdAt: shop.createdAt,
            plan: shop.plan,
            country: shop.country,
            shopify_plan: shop.shopify_plan,
            plan_code: shop.plan_code,
            email: shop.email,
            app_name: shop.app_name,
            shop_name: shop.shop_name,
            first_name: shop.first_name,
            last_name: shop.last_name,
            pricing_type: shop.pricing_type,
            extra_quota: shop.extra_quota,
            session_count: shop.session_count,
            version_plan: shop.version_plan,
        };
        await client
            .index(
                { index: "shop", id: shop._id, document: shop_insert },
                { redaction: { type: "replace", additionalKeys: ["access_token"] } }
            )
            .catch((err) => {
                // console.log(err);
                // console.log(`insert ${shop._id} failed`);
            })
            .then(() => {
                console.log(`insert ${shop._id} success`);
            });
    }
};

main().catch(console.error);

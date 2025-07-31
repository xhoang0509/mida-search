require("module-alias/register");
require("dotenv").config();

const copyDatabase = require("./copy-db");

const run = async () => {
    const arg = process.argv[2];

    switch (arg) {
        case "copy-db":
            await copyDatabase();
            break;
        default:
            console.log("Invalid argument: ", arg);
            break;
    }

    process.exit(1);
};

run();

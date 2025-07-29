const path = require("path");
const LOGGER = isNaN(process.env.LOGGER) ? 1 : parseInt(process.env.LOGGER);
const LOGGER_LEVEL = {
    WARN: "warn",
    INFO: "info",
    DEBUG: "debug",
    ERROR: "error",
};

function buildLog(file, func, level, domain, message) {
    const now = new Date();
    const date = now.toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
    const time = now.toLocaleTimeString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
    const log = {
        filename: `${path.basename(file)}`,
        caller: `${func}`,
        level: level,
        domain: `${domain ? domain : "app"}`,
        message: message instanceof Error ? message.stack : message,
        time: `${date} ${time}`,
    };
    return JSON.stringify(log);
}

function error(file, domain, message) {
    const func = error.caller.name;
    LOGGER === 1 && console.error(buildLog(file, func, LOGGER_LEVEL.ERROR, domain, message));
}

function debug(file, domain, message) {
    const func = debug.caller.name;
    LOGGER === 1 && console.debug(buildLog(file, func, LOGGER_LEVEL.DEBUG, domain, message));
}

function info(file, domain, message) {
    const func = info.caller.name;
    LOGGER === 1 && console.info(buildLog(file, func, LOGGER_LEVEL.INFO, domain, message));
}

function warn(file, domain, message) {
    const func = warn.caller.name;
    LOGGER === 1 && console.warn(buildLog(file, func, LOGGER_LEVEL.WARN, domain, message));
}

module.exports = {
    debug,
    error,
    info,
    warn,
};

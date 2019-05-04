/**
 *
 * @type {typeof TypeUtils}
 */
const TypeUtils = require("@norjs/utils/Type");

/**
 * Subset of NodeJS HTTP module for client connections.
 *
 * @interface
 */
class HttpClientResponseObject {

    /**
     * @returns {number}
     */
    get statusCode () {}

    /**
     *
     * @param eventName {string}
     * @param callback {function}
     */
    on (eventName, callback) {}

}

TypeUtils.defineType(
    "HttpClientResponseObject",
    TypeUtils.classToObjectPropertyTypes(HttpClientResponseObject),
    {
        acceptUndefinedProperties: true
    }
);

/**
 *
 * @type {typeof HttpClientResponseObject}
 */
module.exports = HttpClientResponseObject;

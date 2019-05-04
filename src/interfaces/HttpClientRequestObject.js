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
class HttpClientRequestObject {

    /**
     *
     * @param eventName {string}
     * @param callback {function}
     */
    on (eventName, callback) {}

    /**
     *
     * @param chunk {string}
     * @param encoding {string}
     */
    write (chunk, encoding) {}

    end () {}

}

TypeUtils.defineType(
    "HttpClientRequestObject",
    TypeUtils.classToObjectPropertyTypes(HttpClientRequestObject),
    {
        acceptUndefinedProperties: true
    }
);

/**
 *
 * @type {typeof HttpClientRequestObject}
 */
module.exports = HttpClientRequestObject;

// Interfaces
require('./HttpClientRequestObject.js');
require('./HttpClientResponseObject.js');

/**
 *
 * @type {typeof TypeUtils}
 */
const TypeUtils = require("@norjs/utils/Type");

/**
 * @typedef {Object} HttpClientOptionsObject
 * @prototype {string} method -
 * @prototype {string} path -
 * @prototype {string} socketPath -
 */
TypeUtils.defineType(
    "HttpClientOptionsObject",
    {
        "method": "string",
        "path": "string",
        "socketPath": "string"
    },
    {
        acceptUndefinedProperties: true
    }
);

/**
 * Subset of NodeJS HTTP module for client connections.
 *
 * @interface
 */
class HttpClientModule {

    /**
     *
     * @param options {HttpClientOptionsObject}
     * @param callback {function(HttpClientResponseObject)}
     * @returns {HttpClientRequestObject}
     */
    request (options, callback) {}

}

TypeUtils.defineType(
    "HttpClientModule",
    TypeUtils.classToObjectPropertyTypes(HttpClientModule),
    {
        acceptUndefinedProperties: true
    }
);

/**
 *
 * @type {typeof HttpClientModule}
 */
module.exports = HttpClientModule;

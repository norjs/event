/**
 *
 * @type {typeof TypeUtils}
 */
const TypeUtils = require("@norjs/utils/Type");

/**
 * Subset of NodeJS 'querystring' module.
 *
 * @interface
 */
class QueryStringModule {

    /**
     *
     * @param obj {Object}
     * @param sep {string}
     * @param eq {string}
     * @param options {{encodeURIComponent: function}}
     * @returns {string}
     */
    stringify (
        obj,
        sep = '&',
        eq = '=',
        options = {encodeURIComponent: undefined}
    ) {}

}

TypeUtils.defineType(
    "QueryStringModule",
    TypeUtils.classToObjectPropertyTypes(QueryStringModule),
    {
        acceptUndefinedProperties: true
    }
);

/**
 *
 * @type {typeof QueryStringModule}
 */
module.exports = QueryStringModule;

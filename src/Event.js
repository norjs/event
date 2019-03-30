
const _ = require('lodash');

/**
 *
 * @type {{model: Symbol}}
 */
const PRIVATE = {
    model: Symbol('model')
};

/**
 *
 */
class Event {

    /**
     *
     * @param model {{name: string, payload: *}}
     */
    constructor (model = {}) {

        if (!_.isObject(model)) {
            throw new TypeError(`Argument "model" to new Event(model) is not an object: "${model}"`);
        }

        if (!_.isString(model.name)) {
            throw new TypeError(`Argument "model.name" to new Event(model) is not a string: "${model.name}"`);
        }

        this[PRIVATE.model] = model;
    }

    /**
     *
     * @returns {*}
     */
    get name () {
        return this[PRIVATE.model].name;
    }

    /**
     *
     * @returns {*}
     */
    get payload () {
        return this[PRIVATE.model].payload;
    }

    /**
     * Freeze model from changes.
     *
     * @param model {Event}
     */
    static freeze (model) {
        Object.freeze(model[PRIVATE.model].payload);
        Object.freeze(model[PRIVATE.model]);
        Object.freeze(model);
    }

}

// Exports
module.exports = Event;

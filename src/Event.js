
const _ = require('lodash');

/**
 * The internal data transfer object for Events.
 *
 * @typedef {Object} EventDTO
 * @property {string} name - Name of the event
 * @property {string} time - Time of the event in UTC
 * @property {string|undefined} requestId - Optional request ID which may associate the event with
 *                                          specific operation.
 * @property {*} payload - Optional payload. This should be limited to data which may not change, eg.
 *                         IDs, etc. The order of events will not be guaranteed and observer
 *                         implementations should fetch the latest data from the original API (eg.
 *                         REST interface).
 */

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
     * @param model {EventDTO}
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
     * @returns {EventDTO}
     */
    valueOf () {
        return this[PRIVATE.model];
    }

    /**
     * Converts the internal value as a string presentation of EventDTO.
     *
     * @returns {string}
     */
    toString () {
        return JSON.stringify(this[PRIVATE.model]);
    }

    /**
     *
     * @returns {string}
     */
    get name () {
        return this[PRIVATE.model].name;
    }

    /**
     *
     * @returns {string}
     */
    get time () {
        return this[PRIVATE.model].time;
    }

    /**
     *
     * @returns {string|undefined}
     */
    get requestId () {
        return this[PRIVATE.model].requestId;
    }

    /**
     * Set optional request ID.
     *
     * @param value {string|undefined}
     * @return {Event}
     */
    setRequestId (value) {

        if (!value) {
            if (_.has(this[PRIVATE.model], 'requestId')) {
                delete this[PRIVATE.model].requestId;
            }
            return;
        }

        if (!_.isString(value)) {
            throw new TypeError(`Argument "value" to event.setRequestId(value) is not a string or undefined: "${value}"`);
        }

        this[PRIVATE.model].requestId = value;

        return this;
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

    /**
     * Converts a string presentation of EventDTO to Event object.
     *
     * @param model {string}
     * @return {Event}
     */
    static fromString (model) {
        if (!_.isString(model)) {
            throw new TypeError(`Argument "model" to Event.fromString(model) is not a string: "${model}"`);
        }
        return new Event(JSON.parse(model));
    }

}

// Exports
module.exports = Event;

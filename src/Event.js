
/**
 *
 * @type {typeof TypeUtils}
 */
const TypeUtils = require("@norjs/utils/Type");

/**
 *
 * @typedef {string|number|boolean} EventPayloadValue
 */
TypeUtils.defineType("EventPayloadValue", "string|number|boolean|null");

/**
 * The payload data should be limited to values which may not change, eg. IDs, because the order of events will not
 * be guaranteed and observer implementations should fetch the latest data from the original API (eg. REST interface).
 *
 * @typedef {Object.<string, EventPayloadValue>} EventPayloadType
 */
TypeUtils.defineType("EventPayloadType", "Object.<string, EventPayloadValue>");

/**
 * The internal data transfer object for Events.
 *
 * @typedef {Object} EventDTO
 * @property {string} name - Name of the event
 * @property {string|undefined} [time] - Time of the event in UTC
 * @property {string|undefined} [requestId] - Request ID which may associate the event with specific operation.
 * @property {EventPayloadType|undefined} [payload] - Event payload.
 */
TypeUtils.defineType("EventDTO", {
    "name": "string",
    "time": "string|undefined",
    "requestId": "string|undefined",
    "payload": "EventPayloadType|undefined",
});

/**
 *
 * @type {{model: Symbol}}
 */
const PRIVATE = {
    model: Symbol('model')
};

/**
 * An event object model.
 */
class Event {

    /**
     *
     * @param model {EventDTO}
     */
    constructor (model) {

        TypeUtils.assert(model, "EventDTO");
        TypeUtils.assert(model.name, "string");

        /**
         * @member {EventDTO}
         */
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
        return `Event:${TypeUtils.stringify(this[PRIVATE.model])}`;
    }

    /**
     *
     * @returns {EventDTO}
     */
    toJSON () {
        return this[PRIVATE.model];
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
     *
     * @returns {EventPayloadType}
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
        TypeUtils.assert(model, "Event");
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
        TypeUtils.assert(model, "string");
        return new Event(JSON.parse(model));
    }

}

TypeUtils.defineType("Event", TypeUtils.classToTestType(Event));

/**
 *
 * @type {typeof Event}
 */
module.exports = Event;

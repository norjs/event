/**
 *
 * @type {typeof TypeUtils}
 */
const TypeUtils = require("@norjs/utils/Type");

/**
 * @typedef {Object} TriggerEventServiceRequestDTO
 * @property events {Array.<Event>}
 */
TypeUtils.defineType("TriggerEventServiceRequestDTO",  {
    "events": "Array.<EventDTO>"
});

/**
 * @typedef {Object} TriggerEventServiceResponseDTO
 * @property events {Array.<EventDTO>}
 */
TypeUtils.defineType("TriggerEventServiceResponseDTO",  {
    "events": "Array.<EventDTO>"
});

/**
 * @typedef {Object} TriggerEventServiceResponse
 * @property events {Array.<Event>}
 */
TypeUtils.defineType("TriggerEventServiceResponse",  {
    "events": "Array.<Event>"
});


/**
 * @typedef {Object} StartEventServiceRequestDTO
 * @property {Array.<string>}  events - Event names which were started
 */
TypeUtils.defineType("StartEventServiceRequestDTO", {
    "events": "Array.<string>"
});

/**
 * @typedef {Object} StartEventServiceResponseDTO
 * @property         {string}  fetchId - The fetch ID which this operation affected
 * @property {Array.<string>}  events - Event names which were started
 */
TypeUtils.defineType("StartEventServiceResponseDTO", {
    "fetchId": "string",
    "events": "Array.<string>"
});


/**
 * @typedef {Object} StopEventServiceResponseDTO
 * @property {string} fetchId - The fetch ID which this operation affected
 */
TypeUtils.defineType("StopEventServiceResponseDTO", {
    "fetchId": "string"
});


/**
 * @typedef {Object} SetEventsServiceRequestDTO
 * @property {Array.<string>}  events - Event names which to set
 */
TypeUtils.defineType("SetEventsServiceRequestDTO", {
    "events": "Array.<string>"
});

/**
 * @typedef {Object} SetEventsServiceResponseDTO
 * @property         {string}  fetchId - The fetch ID which this operation affected
 * @property {Array.<string>}  events - Event names which were set
 */
TypeUtils.defineType("SetEventsServiceResponseDTO", {
    "fetchId": "string",
    "events": "Array.<string>"
});


/**
 * @typedef {Object} FetchEventServiceResponseDTO
 * @property        {string}  fetchId - The fetch ID which this operation affected
 * @property {Array.<EventDTO>}  events - Array of received events, otherwise empty array.
 */
TypeUtils.defineType("FetchEventServiceResponseDTO", {
    "fetchId": "string",
    "events": "Array.<EventDTO>"
});

/**
 * @typedef {Object} FetchEventServiceResponse
 * @property        {string}  fetchId - The fetch ID which this operation affected
 * @property {Array.<Event>}  events - Array of received events, otherwise empty array.
 */
TypeUtils.defineType("FetchEventServiceResponse", {
    "fetchId": "string",
    "events": "Array.<Event>"
});


/**
 * An interface for EventServices.
 *
 * @interface
 */
class EventService {

    /**
     * Trigger event(s) at upstream.
     *
     * Resolves successfully if the EventService has successfully taken responsibility of the event,
     * otherwise rejects the promise.
     *
     * @param events {Array.<Event>}
     * @returns {Promise.<TriggerEventServiceResponse>}
     */
    trigger (events) {}

    /**
     * (Re)Set events which the upstream should return to us.
     *
     * @param fetchId {string} Fetch ID you got from .start()
     * @param events {Array.<string>}
     * @returns {Promise.<SetEventsServiceResponseDTO>}
     */
    setEvents (fetchId, events) {}

    /**
     * Long poll for an array of events.
     *
     * @param fetchId {string} Fetch ID you got from .start()
     * @returns {Promise.<FetchEventServiceResponse>} Array of received events, otherwise empty array.
     */
    fetchEvents (fetchId) {}

    /**
     * Start to listen event names which the upstream should relay to us.
     *
     * @param events {Array.<string>}
     * @returns {Promise.<StartEventServiceResponseDTO>} Promise of a response
     */
    start (events) {}

    /**
     * Stop listening events on this fetch ID, and remove this fetch ID.
     *
     * @param fetchId {string} Fetch ID you got from .start()
     * @returns {Promise.<StopEventServiceResponseDTO>}
     */
    stop (fetchId) {}

}

TypeUtils.defineType("EventService", TypeUtils.classToObjectPropertyTypes(EventService));

/**
 *
 * @type {typeof EventService}
 */
module.exports = EventService;

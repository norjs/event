const _ = require('lodash');

/**
 *
 * @type {typeof Event}
 */
const Event = require('./Event.js');

/**
 *
 * @type {typeof EventService}
 */
const EventService = require('./EventService.js');

/**
 *
 * @type {typeof TypeUtils}
 */
const TypeUtils = require("@norjs/utils/Type");

/**
 *
 * @type {{socket: Symbol}}
 */
const PRIVATE = {
    socket: Symbol('socket'),
    events: Symbol('events')
};

/**
 * Implements EventService over an UNIX socket.
 *
 * @implements {EventService}
 */
class SocketEventService {

    /**
     *
     * @param socket {SocketHttpClient}
     * @param events {Array.<string>}
     */
    constructor (socket, events) {

        TypeUtils.assert(socket, "SocketHttpClient");
        TypeUtils.assert(events, "Array.<string>");

        /**
         * @member {SocketHttpClient}
         */
        this[PRIVATE.socket] = socket;

        /**
         * Event names which upstream should tell us.
         *
         * @member {Array.<string>}
         */
        this[PRIVATE.events] = _.map(events, e => e);

    }

    /**
     * Trigger an event at upstream.
     *
     * Resolves successfully if the EventService has successfully taken responsibility of the event,
     * otherwise rejects the promise.
     *
     * @param events {Array.<Event>}
     * @returns {Promise.<TriggerEventServiceResponse>}
     */
    trigger (events) {
        TypeUtils.assert(events, "Array.<Event>");

        const names = _.map(events, e => e.name);

        /**
         *
         * @type {TriggerEventServiceRequestDTO}
         */
        const payload = {
            events: _.map(events, e => e.valueOf())
        };

        return this[PRIVATE.socket].postJson(
            '/trigger',
            {name: names.join(' ')},
            {
                input: payload
            }
        ).then(
            /**
             *
             * @param response {TriggerEventServiceResponseDTO}
             * @returns {TriggerEventServiceResponse}
             */
            response => {
                TypeUtils.assert(response, "TriggerEventServiceResponseDTO");
                return {
                    events: _.map(response.events, event => new Event(event))
                };
            }
        );
    }

    /**
     * Start to listen event names which the upstream should relay to us.
     *
     * @param events {Array.<string>}
     * @returns {Promise.<StartEventServiceResponseDTO>} Promise of a response
     */
    start (events) {
        TypeUtils.assert(events, "Array.<string>");

        /**
         *
         * @type {StartEventServiceRequestDTO}
         */
        const payload = {
            events: _.map(events, e => e)
        };
        return this[PRIVATE.socket].postJson(
            '/start',
            {},
            {
                input: payload
            }
        ).then(response => {
            TypeUtils.assert(response, "StartEventServiceResponseDTO");
            return response;
        });
    }

    /**
     * Set event names which the upstream should relay to us.
     *
     * @param fetchId {string} Fetch ID you got from .start()
     * @returns {Promise.<StopEventServiceResponseDTO>}
     */
    stop (fetchId) {
        TypeUtils.assert(fetchId, "string");
        return this[PRIVATE.socket].postJson(
            '/stop',
            {fetchId}
        ).then(response => {
            TypeUtils.assert(response, "StopEventServiceResponseDTO");
            return response;
        });
    }

    /**
     * Long poll for an array of events.
     *
     * @param fetchId {string} Fetch ID you got from .start()
     * @returns {Promise.<FetchEventServiceResponse>} Array of received events, otherwise empty array.
     */
    fetchEvents (fetchId) {
        TypeUtils.assert(fetchId, "string");
        return this[PRIVATE.socket].postJson('/fetchEvents', {fetchId}).then(
            /**
             *
             * @param response {FetchEventServiceResponseDTO}
             * @returns {FetchEventServiceResponse}
             */
            response => {
                TypeUtils.assert(response, "FetchEventServiceResponseDTO");
                return {
                    fetchId: response.fetchId,
                    events: _.map(response.events, event => new Event(event))
                };
            }
        );
    }

    /**
     * Set events which the upstream should return to us.
     *
     * @param fetchId {string} Fetch ID you got from .start()
     * @param events {Array.<string>}
     * @returns {Promise.<SetEventsServiceResponseDTO>}
     */
    setEvents (fetchId, events) {
        TypeUtils.assert(fetchId, "string");
        TypeUtils.assert(events, "Array.<string>");

        /**
         *
         * @type {SetEventsServiceRequestDTO}
         */
        const payload = {
            events: _.map(events, e => e)
        };

        return this[PRIVATE.socket].postJson(
            '/setEvents',
            {fetchId},
            {
                input: payload
            }
        ).then(response => {
            TypeUtils.assert(response, "SetEventsServiceResponseDTO");
            return response;
        });
    }

}

TypeUtils.defineType("SocketEventService", TypeUtils.classToTestType(SocketEventService));

/**
 *
 * @type {typeof SocketEventService}
 */
module.exports = SocketEventService;

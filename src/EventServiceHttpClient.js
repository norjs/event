const _ = require('lodash');

// Interfaces
require('@norjs/types/interfaces/HttpClient.js');

/**
 *
 * @type {{stop: string, fetchEvents: string, start: string, trigger: string, setEvents: string}}
 */
const ROUTES = {
    trigger: '/trigger',
    start: '/start',
    stop: '/stop',
    fetchEvents: '/fetchEvents',
    setEvents: '/setEvents'
};

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
 * @type {{client: Symbol}}
 */
const PRIVATE = {
    client: Symbol('client')
};

/**
 * Implements EventService interface over an HTTP client.
 *
 * @implements {EventService}
 */
class EventServiceHttpClient {

    /**
     *
     * @param client {HttpClient}
     */
    constructor (client) {

        TypeUtils.assert(client, "HttpClient");

        /**
         * @member {HttpClient}
         */
        this[PRIVATE.client] = client;

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

        return this[PRIVATE.client].postJson(
            ROUTES.trigger,
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
                // console.log('WOOT response: ', response);
                return {
                    events: _.map(response.events || [], event => new Event(event))
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
        return this[PRIVATE.client].postJson(
            ROUTES.start,
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
        return this[PRIVATE.client].postJson(
            ROUTES.stop,
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
        return this[PRIVATE.client].postJson(
            ROUTES.fetchEvents,
            {fetchId}
        ).then(
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

        return this[PRIVATE.client].postJson(
            ROUTES.setEvents,
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

TypeUtils.defineType("EventServiceHttpClient", TypeUtils.classToTestType(EventServiceHttpClient));

/**
 *
 * @type {typeof EventServiceHttpClient}
 */
module.exports = EventServiceHttpClient;

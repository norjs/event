const Event = require('./Event.js');
const EventService = require('./EventService.js');

/**
 *
 * @type {{socket: Symbol}}
 */
const PRIVATE = {
    socket: Symbol('socket'),
    events: Symbol('events')
};

/**
 * Implements an interface to EventService over an UNIX socket.
 *
 */
class SocketEventService extends EventService {

    /**
     *
     * @param socket {SocketHttpClient}
     */
    constructor (socket) {
        super();

        /**
         * @member {SocketHttpClient}
         */
        this[PRIVATE.socket] = socket;

        /**
         * Event names which upstream should tell us.
         *
         * @member {Array.<string>}
         */
        this[PRIVATE.events] = events;

    }

    /**
     * Trigger an event at upstream.
     *
     * Resolves successfully if the EventService has successfully taken responsibility of the event,
     * otherwise rejects the promise.
     *
     * @param event {Event}
     * @returns {Promise}
     * @abstract
     */
    trigger (event) {
        const payload = event.valueOf();
        return this[PRIVATE.socket].postJson(
            '/trigger',
            {name: event.name},
            {
                input: payload
            }
        );
    }

    /**
     * Start to listen event names which the upstream should relay to us.
     *
     * @param events {Array.<{fetchId:string}>}
     * @returns {Promise.<string>} Promise of polling ID
     * @abstract
     */
    start (events) {
        const payload = _.map(events, e => {
            if (!_.isString(e)) {
                throw new TypeError(`Item in "events" argument to SocketEventService.start() was not an string: "${e}"`);
            }
            return e;
        });
        return this[PRIVATE.socket].postJson(
            '/start',
            {},
            {
                input: payload
            }
        );
    }

    /**
     * Set event names which the upstream should relay to us.
     *
     * @param fetchId {string} Fetch ID you got from .start()
     * @returns {Promise}
     * @abstract
     */
    stop (fetchId) {
        if (!_.isString(fetchId)) {
            throw new TypeError(`Argument "fetchId" argument to SocketEventService.stop(fetchId) was not an string: "${fetchId}"`);
        }
        return this[PRIVATE.socket].postJson(
            '/stop',
            {fetchId}
        );
    }

    /**
     * Long poll for an array of events.
     *
     * @param fetchId {string} Fetch ID you got from .start()
     * @returns {Promise.<{events: Array.<Event>}>} Array of received events, otherwise empty array.
     * @abstract
     */
    fetchEvents (fetchId) {
        if (!_.isString(fetchId)) {
            throw new TypeError(`Argument "fetchId" argument to SocketEventService.fetchEvents(fetchId) was not an string: "${fetchId}"`);
        }
        return this[PRIVATE.socket].getJson('/fetchEvents', {fetchId}).then(
            payload => _.map(payload.events, e => new Event(e))
        );
    }

}

// Exports
module.exports = SocketEventService;

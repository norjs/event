
/**
 * Abstract class describing an interface to access an EventService.
 *
 * @abstract
 */
class EventService {

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
    trigger (event) {}

    /**
     * Set events which the upstream should return to us.
     *
     * @param events {Array.<string>}
     * @returns {Promise}
     * @abstract
     */
    setEvents (events) {}

    /**
     * Long poll for an array of events.
     *
     * @returns {Promise.<Array.<Event>>} Array of received events, otherwise empty array.
     * @abstract
     */
    fetchEvents () {}

}

// Exports
module.exports = EventService;

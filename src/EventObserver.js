const _ = require('lodash');
const EventEmitter = require('events');

/**
 *
 * @type {{service: Symbol}}
 */
const PRIVATE = {
    service: Symbol('service'),
    emitter: Symbol('emitter')
};

/**
 *
 */
class EventObserver {

    /**
     *
     * @param service {string} The path to a unix socket file
     */
    constructor ({
        service = undefined
    }={}) {

        if (!(_.isString(service) || service === undefined)) {
            throw new TypeError(`Argument "service" to new EventObserver() was not a string or undefined: "${service}"`);
        }

        /**
         *
         * @type {string}
         */
        this[PRIVATE.service] = service;

        /**
         *
         * @type {EventEmitter}
         */
        this[PRIVATE.emitter] = new EventEmitter();

    }

    /**
     * Removes all listeners
     */
    destroy () {
        this[PRIVATE.emitter].removeAllListeners();
    }

    /**
     * Listens an event.
     *
     * @param name {string|Array.<string>} One or more events to listen
     * @param listener {function} A function which will be called for each event.
     * @returns {function} A function which can be called to remove listener
     */
    on (name, listener) {

        if (!_.isFunction(listener)) {
            throw new TypeError(`Argument "listener" to EventObserver.on() not a function: "${listener}"`);
        }

        if (_.isString(name)) {

            const destructor = () => {
                this[PRIVATE.emitter].off(name, listener);
            };

            this[PRIVATE.emitter].on(name, listener);

            return destructor;

        } else if (_.isArray(name)) {

            if (!_.every(name, n => _.isString(n))) {
                throw new TypeError(`Argument "name" to EventObserver.on() not a string array`);
            }

            // Shallow copy array
            name = _.map(name, n => n);

            const destructor = () => {
                _.each(name, n => {
                    this[PRIVATE.emitter].off(n, listener);
                });
            };

            _.each(name, n => {
                this[PRIVATE.emitter].on(n, listener);
            });

            return destructor;

        } else {
            throw new TypeError(`Argument "name" to EventObserver.on() not a string: "${name}"`);
        }

    }

    /**
     * Trigger an event.
     *
     * @param name {string}
     * @param payload {*}
     */
    trigger (name, ...payload) {
        if (!_.isString(name)) {
            throw new TypeError(`Argument "name" to EventObserver.trigger() not a string: "${name}"`);
        }
        payload = JSON.parse(JSON.stringify(payload));
        let event = {
            name,
            payload: payload.length ? (payload.length === 1 ? payload[0] : payload) : undefined
        };
        this[PRIVATE.emitter].emit(name, event, ...payload);
    }

}

// Exports
module.exports = EventObserver;

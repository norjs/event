const _ = require('lodash');
const EventEmitter = require('events');
const Event = require('./Event.js');
const LogicUtils = require('./LogicUtils.js');

/**
 *
 * @type {number}
 */
const UPSTREAM_START_DELAY = 50;

/**
 *
 * @type {number}
 */
const POLLING_SUCCESS_TIMEOUT = 50;

/**
 *
 * @type {number}
 */
const POLLING_ERROR_TIMEOUT = 2500;

/**
 *
 * @type {{service: Symbol}}
 */
const PRIVATE = {
    service: Symbol('service'),
    emitter: Symbol('emitter'),
    fetchId: Symbol('fetchId'),
    events: Symbol('events'),
    timeoutId: Symbol('timeoutId')
};

/**
 *
 */
class EventObserver {

    /**
     *
     * @param service {SocketEventService} Upstream event service
     */
    constructor ({
        service = undefined
    }={}) {

        if (!(_.isString(service) || service === undefined)) {
            throw new TypeError(`Argument "service" to new EventObserver() was not a string or undefined: "${service}"`);
        }

        /**
         * Interface to upstream event service
         *
         * @member {SocketEventService}
         */
        this[PRIVATE.service] = service;

        /**
         * UUID for fetching events from upstream.
         *
         * @member {string}
         */
        this[PRIVATE.fetchId] = undefined;

        /**
         * Timeout ID
         *
         * @member {*}
         */
        this[PRIVATE.timeoutId] = undefined;

        /**
         * Events which should be listened at upstream
         *
         * @member {string}
         */
        this[PRIVATE.events] = [];

        /**
         * Local event emitter
         *
         * @member {EventEmitter}
         */
        this[PRIVATE.emitter] = new EventEmitter();

        /**
         * Delayed version of .start()
         *
         * @member {Function}
         */
        this._delayedStart = _.debounce(() => this._start(), UPSTREAM_START_DELAY);

    }

    /**
     * Removes all listeners
     */
    destroy () {
        this[PRIVATE.emitter].removeAllListeners();

        if (this[PRIVATE.timeoutId]) {
            clearTimeout(this[PRIVATE.timeoutId]);
            this[PRIVATE.timeoutId] = undefined;
        }

        if (this[PRIVATE.fetchId]) {
            const fetchId = this[PRIVATE.fetchId];

            if (this[PRIVATE.service]) {
                this[PRIVATE.service].stop(fetchId).catch(err => {
                    console.error('Error when stopping upstream: ', err);
                });

                this[PRIVATE.service] = undefined;
            }

            this[PRIVATE.fetchId] = undefined;
        }
    }

    /**
     *
     * @private
     */
    _start () {

        // Ignore if we don't have upstream
        if (!this[PRIVATE.service]) return;

        if (this[PRIVATE.timeoutId]) {
            clearTimeout(this[PRIVATE.timeoutId]);
            this[PRIVATE.timeoutId] = undefined;
        }

        if (this[PRIVATE.fetchId]) {
            const fetchId = this[PRIVATE.fetchId];
            this[PRIVATE.service].stop(fetchId).catch(err => {
                console.error('Error when stopping upstream: ', err);
            });
            this[PRIVATE.fetchId] = undefined;
        }

        const events = this[PRIVATE.events];
        this[PRIVATE.service].start(events).then(payload => {
            this[PRIVATE.fetchId] = payload.fetchId;

            this._startPolling();

        }).catch(err => {
            console.error('Failed to start upstream: ', err);
        });

    }

    /**
     *
     * @private
     */
    _startPolling () {
        if (this[PRIVATE.timeoutId]) {
            clearTimeout(this[PRIVATE.timeoutId]);
            this[PRIVATE.timeoutId] = undefined;
        }
        LogicUtils.tryCatch( () => {
            this._fetchAndEmitUpstreamEvents().then(
                () => {
                    this[PRIVATE.timeoutId] = setTimeout( () => this._startPolling(), POLLING_SUCCESS_TIMEOUT);
                }
            ).catch(
                err => {
                    console.error('Error: ', err);
                    this[PRIVATE.timeoutId] = setTimeout( () => this._startPolling(), POLLING_ERROR_TIMEOUT );
                }
            );
        }, err => {
            console.error('Error: ', err);
            this[PRIVATE.timeoutId] = setTimeout( () => this._startPolling(), POLLING_ERROR_TIMEOUT );
        });
    }

    /**
     *
     * @private
     * @return {Promise}
     */
    _fetchAndEmitUpstreamEvents () {
        const fetchId = this[PRIVATE.fetchId];
        return this[PRIVATE.service].fetchEvents(fetchId).then(payload => {
            _.each(payload.events, event => {
                LogicUtils.tryCatch(() => {
                    this[PRIVATE.emitter].emit(event.name, event, event.payload);
                }, err => {
                    console.error(`Failed to emit Event "${event ? event.name : undefined}" from upstream: `, err);
                    console.log('Event: ', event);
                });
            });
        });
    }

    /**
     *
     * @param names {Array.<string>} The event names to listen at upstream
     * @private
     */
    _addToEvents (names) {

        if (!_.isArray(names)) {
            throw new TypeError(`Argument "names" to EventObserver.trigger() not an array: "${names}"`);
        }

        // Ignore if we don't have upstream
        if (!this[PRIVATE.service]) return;

        const events = this[PRIVATE.events];

        const newEvents = _.filter(names, name => !_.find(events, name));

        // Ignore if we already listen each
        if (!newEvents.length) return;

        _.each(newEvents, name => {
            events.push(name);
        });

        this._delayedStart();
    }

    /**
     *
     * @param names {Array.<string>} The event names to remove from upstream
     * @private
     */
    _removeFromEvents (names) {

        if (!_.isArray(names)) {
            throw new TypeError(`Argument "names" to EventObserver.trigger() not an array: "${names}"`);
        }

        // Ignore if we don't have upstream
        if (!this[PRIVATE.service]) return;

        const events = this[PRIVATE.events];

        const removeEvents = _.filter(names, name => _.find(events, name));

        // Ignore if we already do not listen any
        if (!removeEvents.length) return;

        _.each(removeEvents, name => {
            _.remove(events, eventName => eventName === name);
        });

        this._delayedStart();
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
                this._removeFromEvents([name]);
            };

            this[PRIVATE.emitter].on(name, listener);

            this._addToEvents([name]);

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
                this._removeFromEvents(name);
            };

            _.each(name, n => {
                this[PRIVATE.emitter].on(n, listener);
            });

            this._addToEvents(name);

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

        const time = EventObserver.getTime();

        let event = new Event({
            name,
            time,
            payload: payload.length ? (payload.length === 1 ? payload[0] : payload) : undefined
        });

        this[PRIVATE.emitter].emit(name, event, event.payload);

        if (this[PRIVATE.service]) {
            this[PRIVATE.service].trigger(event).catch(err => {
                console.error('Failed to trigger event upstream: ', err);
            });
        }
    }

    /**
     *
     */
    static getTime () {
        return (new Date()).toISOString();
    }

}

// Exports
module.exports = EventObserver;

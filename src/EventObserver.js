const _ = require('lodash');
const EventEmitter = require('events');
const Event = require('./Event.js');
const LogicUtils = require("@norjs/utils/Logic");
const TypeUtils = require("@norjs/utils/Type");

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
    timeoutId: Symbol('timeoutId'),
    setEventsPromise: Symbol('setEventsPromise'),
    setEventsRescheduled: Symbol('setEventsRescheduled')
};

/**
 * Implementation for observing and triggering events.
 */
class EventObserver {

    /**
     *
     * @param service {EventService} Upstream event service
     */
    constructor ({
        service = undefined
    }={}) {

        if (service !== undefined) {
            TypeUtils.assert(service, "EventService");
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
         * Current .setEvents() promise
         *
         * @member {Promise}
         */
        this[PRIVATE.setEventsPromise] = undefined;

        /**
         * True if .setEvents() has been scheduled to happen again after this[PRIVATE.setEventsPromise]
         *
         * @member {boolean}
         */
        this[PRIVATE.setEventsRescheduled] = false;

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

    // noinspection JSUnusedGlobalSymbols
    /**
     * Set upstream event service.
     *
     * @param service {EventService} Upstream event service
     */
    setService (service) {
        TypeUtils.assert(service, "EventService");
        this[PRIVATE.service] = service;
        if (this[PRIVATE.events].length) {
            this._delayedStart();
        }
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
            TypeUtils.assert(payload, "StartResponseDTO");
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
     * Add new events to listen for in the upstream.
     *
     * @param names {Array.<string>} The event names to listen at upstream
     * @private
     */
    _addToEvents (names) {

        TypeUtils.assert(names, "Array.<string>");

        // Ignore if we don't have upstream event service
        if (!this[PRIVATE.service]) return;

        const events = this[PRIVATE.events];
        const newEvents = _.filter(names, name => !_.find(events, name));

        // Ignore if we already listen each event
        if (!newEvents.length) return;

        _.each(newEvents, name => {
            events.push(name);
        });

        this._setUpstreamEvents();
    }

    /**
     * Starts a call to set events array in the upstream, or schedules one later.
     *
     * @private
     */
    _setUpstreamEvents () {

        const events = this[PRIVATE.events];

        // Schedule a start if we don't have a fetch id yet
        if (!this[PRIVATE.fetchId]) {
            this._delayedStart();
            return;
        }

        // Ignore if already re-scheduled
        if (this[PRIVATE.setEventsRescheduled]) {
            return;
        }

        // Schedule later setEvents if one is already in progress
        if (this[PRIVATE.setEventsPromise]) {
            this[PRIVATE.setEventsPromise].finally( () => this._setUpstreamEvents() );
            this[PRIVATE.setEventsRescheduled] = true;
            return;
        }

        // Reset upstream array
        const fetchId = this[PRIVATE.fetchId];
        this[PRIVATE.setEventsPromise] = this[PRIVATE.service].setEvents(fetchId, events).catch(err => {
            console.error('Error: ', err);
            console.info('Scheduling restart because of an error in setting upstream event.');
            this._delayedStart();
        }).finally(() => {
            if (this[PRIVATE.setEventsPromise]) {
                this[PRIVATE.setEventsPromise] = undefined;
            }
            this[PRIVATE.setEventsRescheduled] = false;
        });

    }

    /**
     *
     * @param names {Array.<string>} The event names to remove from upstream
     * @private
     */
    _removeFromEvents (names) {

        TypeUtils.assert(names, "Array.<string>");

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

        TypeUtils.assert(name, "string|Array.<string>");
        TypeUtils.assert(listener, "function");

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
     * @param payload {EventPayloadType}
     */
    trigger (name, payload = undefined) {
        TypeUtils.assert(name, "string");

        if (payload !== undefined) {
            TypeUtils.assert(payload, "EventPayloadType");
            payload = JSON.parse(JSON.stringify(payload));
        }

        const time = EventObserver.getTime();

        const event = new Event({
            name,
            time,
            payload
        });

        // console.log('event: ', event.valueOf());

        this[PRIVATE.emitter].emit(name, event, event.payload);

        if (this[PRIVATE.service]) {
            this[PRIVATE.service].trigger([event]).catch(err => {
                console.error('Failed to trigger event upstream: ', err);
            });
        }
    }

    /**
     *
     * @return {string}
     */
    static getTime () {
        return (new Date()).toISOString();
    }

}

TypeUtils.defineType("EventObserver", TypeUtils.classToTestType(EventObserver));

/**
 *
 * @type {typeof EventObserver}
 */
module.exports = EventObserver;

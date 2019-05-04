#!/usr/bin/node
// nor-event

const _ = require('lodash');

/**
 *
 * @type {string}
 */
const VERBOSE_ARG = '--verbose';

/**
 *
 * @type {string}
 */
const TRIGGER_PREFIX_ARG = '--trigger=';

/**
 *
 * @type {string}
 */
const PAYLOAD_PREFIX_ARG = '--payload=';

/**
 *
 * @type {string}
 */
const WAIT_PREFIX_ARG = '--wait=';

/**
 * @type {string[]}
 */
const ARGS = process.argv.slice(2);

/**
 * @type {boolean}
 */
const VERBOSE = _.some(ARGS, arg => arg === VERBOSE_ARG);

/**
 * @type {Array.<string>}
 */
const TRIGGER_EVENTS = _.filter(
	ARGS,
	arg => _.startsWith(arg, TRIGGER_PREFIX_ARG)
).map(
	a => a.substr(TRIGGER_PREFIX_ARG.length)
);

/**
 * @type {Array.<string>}
 */
const WAIT_EVENTS = _.filter(ARGS, arg => _.startsWith(arg, WAIT_PREFIX_ARG)).map(a => a.substr(WAIT_PREFIX_ARG.length));

/**
 *
 * @type {typeof TypeUtils}
 */
const TypeUtils = require("@norjs/utils/Type");

/**
 *
 * @type {typeof LogicUtils}
 */
const LogicUtils = require('@norjs/utils/Logic');

LogicUtils.tryCatch( () => {

	/**
	 * @type {Array.<*>}
	 */
	const TRIGGER_PAYLOADS = _.filter(
		ARGS,
		arg => _.startsWith(arg, PAYLOAD_PREFIX_ARG)
	).map(
		a => JSON.parse(a.substr(PAYLOAD_PREFIX_ARG.length))
	);

	// Interfaces
	require('./interfaces/HttpClientModule.js');

	/**
	 *
	 * @type {HttpClientModule}
	 */
	const HTTP = require('http');

	/**
	 *
	 * @type {typeof SocketEventService}
	 */
	const SocketEventService = require('./SocketEventService.js');

	/**
	 *
	 * @type {typeof SocketHttpClient}
	 */
	const SocketHttpClient = require('./SocketHttpClient.js');

	/**
	 *
	 * @type {typeof Event}
	 */
	const Event = require('./Event.js');

	/**
	 *
	 * @type {string}
	 */
	const NODE_CONNECT = process.env.NODE_CONNECT;

	if (!NODE_CONNECT) {
		throw new Error(`You need to specify socket file to connect to: NODE_CONNECT not defined`);
	}

	const socket = new SocketHttpClient({
		socket: NODE_CONNECT,
		httpModule: HTTP,
		queryStringModule: require('querystring')
	});

	const service = new SocketEventService(socket);

	if (TRIGGER_EVENTS.length) {
		const events = _.map(TRIGGER_EVENTS, (eventName, index) => new Event({
			name: eventName,
			payload: index < TRIGGER_PAYLOADS.length ? TRIGGER_PAYLOADS[index] : undefined
		}));
		return service.trigger(events).catch(err => handleError(err));
	}

	if (WAIT_EVENTS.length) {
		return service.start(WAIT_EVENTS).then(
			result => fetchEventsAndStop(service, result)
		).then(
			/**
			 *
			 * @param events {Array.<Event>}
			 */
			events => {

				_.forEach(events, event => {
					console.log(event.toJSON());
				});

		}).catch(err => handleError(err));
	}

}, err => handleError(err));

/**
 *
 * @param service {SocketEventService}
 * @param result {StartEventServiceResponseDTO}
 * @returns {Promise.<Array.<Event>>}
 */
function fetchEventsAndStop (service, result) {

	// console.log('WOOT: fetchEvents: ', result);

	const events = [];

	/**
	 *
	 * @type {string}
	 */
	const fetchId = result.fetchId;

	return service.fetchEvents(fetchId).then(
		/**
		 *
		 * @param fetchResult {FetchEventServiceResponse}
		 */
		fetchResult => {

			// console.log('WOOT: fetchResult: ', fetchResult);

			if (fetchResult.events && fetchResult.events.length) {
				_.forEach(fetchResult.events, event => {
					events.push(event);
				});
			}

			return service.stop(fetchId).then(stopResult => {

				if (stopResult.events && stopResult.events.length) {
					_.forEach(stopResult.events, event => {
						events.push(event);
					});
				}

				// console.log('WOOT: stopResult: ', stopResult);

				return events;
			});

		}
	);
}

/**
 *
 * @param err
 */
function handleError (err) {

	console.error(`Exception: ${TypeUtils.toString(err)}`);

	if (VERBOSE && err.stack) {
		console.error(err.stack);
	}

	process.exit(1);
}
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
const TRIGGER_EVENTS = _.filter(ARGS, arg => _.startsWith(arg, TRIGGER_PREFIX_ARG)).map(a => a.substr(TRIGGER_PREFIX_ARG.length));

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
		const events = _.map(TRIGGER_EVENTS, eventName => new Event({name: eventName}));
		return service.trigger(events).catch(err => handleError(err));
	}

}, err => handleError(err));

function handleError (err) {

	console.error(`Exception: ${TypeUtils.toString(err)}`);

	if (VERBOSE && err.stack) {
		console.error(err.stack);
	}

	process.exit(1);
}
const _ = require('lodash');
const sinon = require('sinon');
const assert = require('assert');

/**
 *
 * @type {typeof TypeUtils}
 */
const TypeUtils = require('@norjs/utils/Type');

/**
 *
 * @type {typeof Event}
 */
const Event = require('../src/Event.js');

/**
 *
 * @type {typeof SocketEventService}
 */
const SocketEventService = require('../src/SocketEventService.js');

describe('SocketEventService', () => {

    /**
     * Mock of SocketHttpClient
     *
     * @type {SocketHttpClient}
     */
    class SocketHttpClientMock {
        postJson () {}
    }

    TypeUtils.defineType("SocketHttpClient", TypeUtils.classToObjectPropertyTypes(SocketHttpClientMock));

    let socket;
    let events;

    /**
     * @type {SocketEventService}
     */
    let service;

    beforeEach(() => {
        socket = new SocketHttpClientMock();
        events = [
            "foo",
            "bar"
        ];
        service = new SocketEventService(socket, events);
    });

    afterEach(() => {
        socket = undefined;
        service = undefined;
        events = undefined;
    });

    describe('#trigger', () => {

        beforeEach( () => {
            sinon.stub(socket, "postJson");
        });

        afterEach( () => {
            socket.postJson.restore();
        });

        it('can trigger an event', () => {

            const eventName = 'test';
            const eventTime = '2019-04-28T04:48:00.405Z';
            const apiPath = '/trigger';

            /**
             *
             * @type {TriggerEventServiceResponseDTO}
             */
            const responseDTO = {
                events: [
                    {name: eventName, time: eventTime}
                ]
            };

            const responsePromise = new Promise( resolve => {
                resolve(responseDTO);
            });

            socket.postJson.returns(responsePromise);

            const event = new Event({name: eventName, time: eventTime});

            assert( !socket.postJson.called );
            const result = service.trigger([event] );
            TypeUtils.assert(result, "Promise");

            return result.then( response => {
                assert( socket.postJson.calledOnce );

                TypeUtils.assert(socket.postJson.args[0][0], "string");
                TypeUtils.assert(socket.postJson.args[0][1], "{name:string}");
                TypeUtils.assert(socket.postJson.args[0][2], "{input: {events: Array.<EventDTO>}}");

                assert.strictEqual( socket.postJson.args[0][0], apiPath);
                assert.strictEqual( socket.postJson.args[0][1].name, eventName);

                assert.strictEqual( socket.postJson.args[0][2].input.events.length, 1);
                assert.strictEqual( socket.postJson.args[0][2].input.events[0].name, eventName);
                assert.strictEqual( socket.postJson.args[0][2].input.events[0].time, eventTime);

                TypeUtils.assert(response, "TriggerEventServiceResponse");
                assert.strictEqual( response.events.length, 1);
                assert.strictEqual( response.events[0].name, eventName);
                assert.strictEqual( response.events[0].time, eventTime);
            });

        });

        it('can start a fetch session', () => {

            const fetchId = '1234';
            const eventName = 'test';
            const apiPath = '/start';

            /**
             *
             * @type {StartEventServiceResponseDTO}
             */
            const responseDTO = {
                fetchId: fetchId,
                events: [
                    eventName
                ]
            };

            const responsePromise = new Promise( resolve => {
                resolve(responseDTO);
            });

            socket.postJson.returns(responsePromise);

            const events = [eventName];

            assert( !socket.postJson.called );
            const result = service.start(events);
            TypeUtils.assert(result, "Promise");
            return result.then( response => {

                assert( socket.postJson.calledOnce );

                TypeUtils.assert(socket.postJson.args[0][0], "string");
                TypeUtils.assert(socket.postJson.args[0][1], "{}");
                TypeUtils.assert(socket.postJson.args[0][2], "{input: {events: Array.<string>}}");

                assert.strictEqual( socket.postJson.args[0][0], apiPath);
                assert.strictEqual( _.keys(socket.postJson.args[0][1]).length, 0);

                assert.strictEqual( socket.postJson.args[0][2].input.events.length, 1);
                assert.strictEqual( socket.postJson.args[0][2].input.events[0], eventName);

                TypeUtils.assert(response, "StartEventServiceResponseDTO");
                assert.strictEqual( response.fetchId, fetchId);
                assert.strictEqual( response.events.length, 1);
                assert.strictEqual( response.events[0], eventName);
            });

        });

        it('can stop a fetch session', () => {

            const fetchId = '1234';
            const apiPath = '/stop';

            /**
             *
             * @type {StopEventServiceResponseDTO}
             */
            const responseDTO = {
                fetchId: fetchId
            };

            const responsePromise = new Promise( resolve => {
                resolve(responseDTO);
            });

            socket.postJson.returns(responsePromise);

            assert( !socket.postJson.called );
            const result = service.stop(fetchId);
            TypeUtils.assert(result, "Promise");
            return result.then( response => {

                assert( socket.postJson.calledOnce );

                TypeUtils.assert(socket.postJson.args[0][0], "string");
                TypeUtils.assert(socket.postJson.args[0][1], "{fetchId:string}");

                assert.strictEqual( socket.postJson.args[0][0], apiPath);
                assert.strictEqual( socket.postJson.args[0][1].fetchId, fetchId);

                TypeUtils.assert(response, "StopEventServiceResponseDTO");
                assert.strictEqual( response.fetchId, fetchId);
            });

        });


        it('can fetch events', () => {

            const eventName = 'test';
            const eventTime = '2019-04-28T04:48:00.405Z';

            const fetchId = '1234';
            const apiPath = '/fetchEvents';

            /**
             *
             * @type {FetchEventServiceResponseDTO}
             */
            const responseDTO = {
                fetchId: fetchId,
                events: [
                    {name: eventName, time: eventTime}
                ]
            };

            const responsePromise = new Promise( resolve => {
                resolve(responseDTO);
            });

            socket.postJson.returns(responsePromise);

            assert( !socket.postJson.called );
            const result = service.fetchEvents(fetchId);
            TypeUtils.assert(result, "Promise");
            return result.then( response => {

                assert( socket.postJson.calledOnce );

                TypeUtils.assert(socket.postJson.args[0][0], "string");
                TypeUtils.assert(socket.postJson.args[0][1], "{fetchId:string}");

                assert.strictEqual( socket.postJson.args[0][0], apiPath);
                assert.strictEqual( socket.postJson.args[0][1].fetchId, fetchId);

                TypeUtils.assert(response, "FetchEventServiceResponse");
                assert.strictEqual( response.fetchId, fetchId);
                assert.strictEqual( response.events.length, 1);
                assert.strictEqual( response.events[0].name, eventName);
                assert.strictEqual( response.events[0].time, eventTime);
            });

        });

        it('can set events for a fetch session', () => {

            const fetchId = '1234';
            const eventName = 'test';
            const apiPath = '/setEvents';

            /**
             *
             * @type {SetEventsServiceResponseDTO}
             */
            const responseDTO = {
                fetchId,
                events: [
                    eventName
                ]
            };

            const responsePromise = new Promise( resolve => {
                resolve(responseDTO);
            });

            socket.postJson.returns(responsePromise);

            const events = [eventName];

            assert( !socket.postJson.called );
            const result = service.setEvents(fetchId, events);
            TypeUtils.assert(result, "Promise");
            return result.then( response => {

                assert( socket.postJson.calledOnce );

                TypeUtils.assert(socket.postJson.args[0][0], "string");
                TypeUtils.assert(socket.postJson.args[0][1], "{fetchId:string}");
                TypeUtils.assert(socket.postJson.args[0][2], "{input: {events: Array.<string>}}");

                assert.strictEqual( socket.postJson.args[0][0], apiPath);

                assert.strictEqual( socket.postJson.args[0][1].fetchId, fetchId);

                assert.strictEqual( socket.postJson.args[0][2].input.events.length, 1);
                assert.strictEqual( socket.postJson.args[0][2].input.events[0], eventName);

                TypeUtils.assert(response, "SetEventsServiceResponseDTO");
                assert.strictEqual( response.fetchId, fetchId);
                assert.strictEqual( response.events.length, 1);
                assert.strictEqual( response.events[0], eventName);
            });

        });


    });

});

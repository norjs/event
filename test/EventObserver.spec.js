const _ = require('lodash');
const sinon = require('sinon');
const assert = require('assert');

const EventObserver = require('../src/EventObserver.js');

describe('EventObserver', () => {

    let observer;

    before(() => {
        observer = new EventObserver();
    });

    after(() => {
        observer.destroy();
    });

    describe('#trigger', () => {

        it('can trigger events', () => {
            var listener = sinon.stub();
            observer.on('foobar', listener);
            assert(!listener.called);
            observer.trigger('foobar');
            assert(listener.called);
    	});

        it('can trigger events with payload', () => {
            const EVENT_NAME = 'foobar';
            const payload = "1234qwerty";
            const listener = sinon.stub();
            observer.on(EVENT_NAME, listener);
            assert(!listener.called);
            observer.trigger(EVENT_NAME, payload);
            assert(_.isObject(listener.args[0][0]));
            assert(_.isEqual(listener.args[0][0].name, EVENT_NAME));
            assert(_.isEqual(listener.args[0][0].payload, payload));
            assert(_.isEqual(listener.args[0][1], payload));
        });

    });

    describe('#on', () => {

        it('can listen events', () => {
            var listener = sinon.stub();
            observer.on('foobar', listener);
            assert(!listener.called);
            observer.trigger('foobar');
            assert(listener.called);
    	});

        it('can listen multiple events at the same time', () => {
            var listener = sinon.stub();
            observer.on(['foo', 'bar'], listener);
            assert(!listener.called);

            observer.trigger('foo');
            assert(listener.callCount === 1);
            assert(_.isEqual(listener.args[0][0].name, 'foo'));

            observer.trigger('bar');
            assert(listener.callCount === 2);
            assert(_.isEqual(listener.args[1][0].name, 'bar'));

    	});

        it('can unlisten events', () => {
            var listener = sinon.stub();
            const destructor = observer.on('foobar', listener);
            assert(!listener.called);
            destructor();
            observer.trigger('foobar');
            assert(!listener.called);
    	});

    });

    describe('#destroy', () => {

        it('can destroy listeners', () => {
            var listener = sinon.stub();
            const destructor = observer.on('foobar', listener);
            assert(!listener.called);
            observer.destroy();
            observer.trigger('foobar');
            assert(!listener.called);
        });

    });

});

import {Cause, Causes, Action, App} from '../..';
import {update, init, view, INCREMENT, INCREMENT_BY, INCREMENT_LATER, GET_TIME, GOT_TIME} from '../asynccounter.js';
const assert = require('assert');

const equalActions = (expected) => (actual) => assert.deepEqual(actual, expected);

describe('Counter', () => {

    it('Init with correct state and cause', () => {
        const result = init();
        const {state, cause} = result;
        const testPerformer = (cause) => ({
            delay: (ms) => (assert.equal(ms, 30), Promise.resolve()),
        })
        const perform = Causes.performWith(Causes.basePerformer, testPerformer);
        const expectedActions = [Action(INCREMENT)];
        return perform(cause).then(equalActions(expectedActions));
    });

    it('Should be cause-free when incrementing', () => {
        const {state, cause} = update(4, Action(INCREMENT));
        assert.equal(state, 5);
        assert.equal(cause, Causes.none);
    });

    it('should increment by specified amount', () => {
        const {state, cause} = update(4, Action(INCREMENT_BY, 4));
        assert.equal(state, 8);
        assert.equal(cause, Causes.none);
    });

    it('Should be able to do a delayed increment', () => {
        const testPerformer = (cause) => ({
            delay: (ms) => (assert(ms === 100 || ms === 200), Promise.resolve()),
        });
        const perform = Causes.performWith(Causes.basePerformer, testPerformer);
        const {state, cause} = update(4, Action(INCREMENT_LATER));
        assert.equal(state, 4);
        const expectedActions = [Action(INCREMENT), Action(INCREMENT)];
        return perform(cause)
            .then(equalActions(expectedActions))
    });

    it('request time and increment concurrently', () => {
        const NOW = 2;
        const timePerformer = (cause) => {
            const {type} = cause;
            // Test different performers for different causes.
            // This is just for demonstration purposes and usually not needed,
            // instead you may preferably create a test performer that
            // handles all types simultaneously.
            if (type === 'currentTime') {
                return {
                    currentTime: (data) => {
                        assert.equal(data, undefined); // There should be no input to this cause.
                        return NOW; // Return a fake time
                    }
                };
            } else if(type === 'delay') {
                return {
                    delay: (ms) => assert.equal(ms, 20)
                }
            }
        };
        const perform = Causes.performWith(Causes.basePerformer, timePerformer);
        const {state, cause} = update(4, Action(GET_TIME));
        assert.equal(state, 4);
        const expectedActions = [Action(GOT_TIME, NOW), Action(INCREMENT)];
        return perform(cause).then(equalActions(expectedActions));
    });

    it('should run with the App constructor', () => {
        return new Promise((resolve) => {
            const app = App({update, init, view});
            app.onStart((view) => {
                assert.equal(view, 'Value: 0');
            });
            app.onView(((i) => (view) => {
                assert.equal(view, 'Value: 1');
                i += 1;
                resolve();
            })(0));
            const {state, cause} = update(4, Action(INCREMENT_LATER));
            app.start();
        });
    })
});



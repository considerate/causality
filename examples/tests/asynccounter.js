import {Effect, Action, performWith, basePerformer, equalActions} from '../..';
import {update, init, INCREMENT, INCREMENT_BY, INCREMENT_LATER, GET_TIME, GOT_TIME} from '../asynccounter.js';
const assert = require('assert');

describe('Counter', () => {

    it('Init with correct state and effect', () => {
        const result = init();
        const {state, effect} = result;
        const testPerformer = (effect) => ({
            delay: (ms) => (assert.equal(ms, 3000), Promise.resolve()),
        })
        const perform = performWith(basePerformer, testPerformer);
        const expectedActions = [Action(INCREMENT)];
        return perform(effect).then(equalActions(expectedActions));
    });

    it('Should be effect-free when incrementing', () => {
        const {state, effect} = update(4, Action(INCREMENT));
        assert.equal(state, 5);
        assert.equal(effect, Effect.none);
    });

    it('should increment by specified amount', () => {
        const {state, effect} = update(4, Action(INCREMENT_BY, 4));
        assert.equal(state, 8);
        assert.equal(effect, Effect.none);
    });

    it('Should be able to do a delayed increment', () => {
        const testPerformer = (effect) => ({
            delay: (ms) => (assert([200, 100].includes(ms)), Promise.resolve()),
        });
        const perform = performWith(basePerformer, testPerformer);
        const {state, effect} = update(4, Action(INCREMENT_LATER));
        assert.equal(state, 4);
        const expectedActions = [Action(INCREMENT), Action(INCREMENT)];
        return perform(effect)
            .then(equalActions(expectedActions))
    });

    it('request time and increment concurrently', () => {
        const NOW = 2;
        const timePerformer = (effect) => {
            const {type} = effect;
            // Test different performers for different effects.
            // This is just for demonstration purposes and usually not needed,
            // instead you may preferably create a test performer that
            // handles all types simultaneously.
            if (type === 'currentTime') {
                return {
                    currentTime: (data) => {
                        assert.equal(data, undefined); // There should be no input to this effect.
                        return NOW; // Return a fake time
                    }
                };
            } else if(type === 'delay') {
                return {
                    delay: (ms) => assert.equal(ms, 20)
                }
            }
        };
        const perform = performWith(basePerformer, timePerformer);
        const {state, effect} = update(4, Action(GET_TIME));
        assert.equal(state, 4);
        const expectedActions = [Action(GOT_TIME, NOW), Action(INCREMENT)];
        return perform(effect).then(equalActions(expectedActions));
    });
});



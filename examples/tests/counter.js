import {Effect, SideEffect, Action, performWith, basePerformer, equalActions} from '../..';
import {update, init, INCREMENT, INCREMENT_BY, INCREMENT_LATER} from '../counter.js';
const assert = require('assert');

describe('Counter', () => {

    it('Init with correct state and effect', () => {
        const result = init();
        const {state, effect} = result;
        const perform = performWith(basePerformer, {
            delay: (ms) => (assert.equal(ms, 3000), Promise.resolve()),
        });
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
        const perform = performWith(basePerformer, {
            delay: (ms) => (assert([200, 100].includes(ms)), Promise.resolve()),
        });
        const {state, effect} = update(4, Action(INCREMENT_LATER));
        assert.equal(state, 4);
        return perform(effect)
            .then(equalActions([Action(INCREMENT), Action(INCREMENT)]))
    });

});



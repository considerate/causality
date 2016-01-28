import {Effect, SideEffect, Action, testEffects} from '../..';
import {update, init, types} from '../counter.js';
const assert = require('assert');

let result = init();
let {state, effect} = result;
const {increment, incrementLater, incrementBy} = types;

describe('Counter', () => {

    it('Init with correct state and effect', () => {
        let expected = {
            state: 0,
            effect: Effect.call((...args) => {
                return Action(incrementLater, args);
            }, 3000),
            actions: [Action(incrementLater, 3000)]
        };
        return testEffects(init,assert)({
            expected
        });
    });

    it('Should be effect-free when incrementing', () => {
        const expected = {
            state: 5,
            effect: Effect.none
        };
        return testEffects(update, assert)({
            state: 4,
            action: Action(increment),
            expected,
        });
    });

    it('Should be able to do a delayed increment', () => {
        const expected = {
            state: 4,
            effect: Effect.all([
                Effect.call((ms) => ms, 200),
                Effect.call((ms) => ms, 100),
            ]).map((action) => {
                return Action(incrementBy, 1);
            }),
            actions: [Action(incrementBy,1), Action(incrementBy,1)],
        };
        return testEffects(update, assert)({
            action: Action(incrementLater, 100),
            state: 4,
            expected: expected
        });
    });

});



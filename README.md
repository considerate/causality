# effect.js
Declarative and testable side-effects in JavaScript.

## Example Implementation

```js
import {Action, Result, Effect, Types} from 'effect.js';

const delay = ms => new Promise(resolve => {
    setTimeout(resolve, ms);
});

export const types = Types('increment', 'incrementLater', 'incrementBy');
const {increment, incrementLater, incrementBy} = types;
const waitAndInc = (ms) => delay(ms).then(() => Action(types.increment));
const incLater = ms => Effect.all(
    [
        Effect.call(waitAndInc, ms*2),
        Effect.call(waitAndInc, ms)
    ]
)
.map(actions => {
    const count = actions.length;
    return Action(types.incrementBy, count);
});

export const update = (state, action) => {
    const {type, data} = action;
    if(type === increment) {
        return Result(state+1);
    }
    else if(type === incrementLater) {
        const effect = incLater(100);
        return Result(state, effect);
    }
    else if(type === incrementBy) {
        return Result(state+data);
    }
};

export const init = () => Result(0, Effect.call(waitAndInc, 3000));

```

## Example Tests

```js
import {Effect, SideEffect, Action, testEffects} from 'effect.js';
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
            ]).map((actions) => {
                return Action(incrementBy, actions.length);
            }),
            actions: [Action(incrementBy,2)],
        };
        return testEffects(update, assert)({
            action: Action(incrementLater, 100),
            state: 4,
            expected: expected
        });
    });

});

```

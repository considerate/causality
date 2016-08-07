import {Action, Result, Effect} from '..';

/**
 * This is the default performer
 * It will run in production but not
 * in tests. Use a custom performer
 * akin to what is done in ./tests/asynccounter.js
 * when running tests.
 */
const delayPerformer = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms))
};
const delay = ms => Effect.create('delay', ms, delayPerformer);

export const INCREMENT = 'increment';
export const INCREMENT_LATER = 'incrementLater';
export const INCREMENT_BY = 'incrementBy';

// Wait for `ms` milliseconds and then increment counter.
const waitAndInc = (ms) => delay(ms).map(() => Action(INCREMENT));

// These effects will run concurrently.
const incLater = ms => Effect.all(
    [
        waitAndInc(ms*2),
        waitAndInc(ms)
    ]
);

export const init = () => Result(0, waitAndInc(3000));

export const update = (state, action) => {
    const {type, data} = action;
    if(type === INCREMENT) {
        return Result(state+1);
    }
    else if(type === INCREMENT_LATER) {
        const effect = incLater(100);
        return Result(state, effect);
    }
    else if(type === INCREMENT_BY) {
        return Result(state+data);
    }
};

export const view = (state) => `Value: ${state}`;

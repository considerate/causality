import {Action, Result, Effect, Types} from '..';

/**
 * This is the default performer
 * It will run in production but not
 * in tests. Use a custom performer
 * akin to what is done in ./tests/counter.js
 * when running tests.
 */
const delayPerformer = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms))
};
const delay = ms => Effect.create('delay', ms, delayPerformer);

export const INCREMENT = 'increment';
export const INCREMENT_LATER = 'incrementLater';
export const INCREMENT_BY = 'incrementBy';
const waitAndInc = (ms) => delay(ms).map(() => Action(INCREMENT));
const incLater = ms => Effect.all(
    [
        waitAndInc(ms*2),
        waitAndInc(ms)
    ]
);

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

export const init = () => Result(0, waitAndInc(3000));


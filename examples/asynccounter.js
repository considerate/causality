import {Action, Result, Effect, Effects} from '..';

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
const delay = (ms) => Effects.create('delay', ms, delayPerformer);

// A performer can return a base value as well as a promise.
const timePerformer = () => Date.now();
const time = Effects.create('currentTime', undefined, timePerformer);

export const INCREMENT = 'increment';
export const INCREMENT_LATER = 'incrementLater';
export const INCREMENT_BY = 'incrementBy';
export const GET_TIME = 'requestTime';
export const GOT_TIME = 'receivedTime';

// Wait for `ms` milliseconds and then increment counter.
const increment = () => Action(INCREMENT);
const waitAndInc = (ms) => delay(ms).map(increment);

// These effects will run concurrently.
const incLater = ms => Effects.all(
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
    } else if(type === INCREMENT_LATER) {
        const effect = incLater(100);
        return Result(state, effect);
    } else if(type === INCREMENT_BY) {
        return Result(state+data);
    } else if(type === GET_TIME) {
        const getTime = time.map((timestamp) => {
            return Action(GOT_TIME, timestamp);
        });
        return Result(state, Effects.all([getTime, waitAndInc(20)]));
    } else if(type === GOT_TIME) {
        return Result(state);
    }
};

export const view = (state) => `Value: ${state}`;

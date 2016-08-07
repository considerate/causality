import {Action, Result, Effect} from '..';

export const INCREMENT = 'increment';
export const DECREMENT = 'decrement';

export const init = () => Result(0);

export const update = (state, action) => {
    const {type, data} = action;
    if(type === INCREMENT) {
        return Result(state+1);
    } else if(type === DECREMENT) {
        return Result(state-1);
    }
};

export const view = (state) => `Value: ${state}`;

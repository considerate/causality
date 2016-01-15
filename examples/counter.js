import {Action, Result, Effect, Types} from '..';

const delay = ms => new Promise(resolve => {
    setTimeout(resolve, ms);
});

export const types = Types('increment', 'incrementLater', 'incrementBy');
const {increment, incrementLater, incrementBy} = types;
const waitAndInc = (ms) => delay(ms).then(() => Action(types.increment));
const incLater = ms => Effect.all(
    [
        Effect.call(waitAndInc, ms*2), // : Effect Action
        Effect.call(waitAndInc, ms)
    ]
) // : Effect (List Action)
.map(actions => { // List Action -> Action
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

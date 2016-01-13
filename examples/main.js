const assert = require('assert');
import {Effect, Types, Result, Action, perform} from '..';
import {update as updateCounter, init as initCounter, types} from './counter.js';

const update = (state, action) => {
    const {type} = action;
    const side = type;
    const unwrapped = Action.unwrap(action);
    const before = state[side];
    const {state: after, effect} = updateCounter(before,unwrapped);
    state[side] = after;
    const mainEffect = effect.map(Action.wrap(side));
    return Result(state, mainEffect);
};

const init = () => ({
    left: initCounter(),
    right: initCounter(),
});

const view = (state) => {
    console.log(state);
}

const main = Effect.app({init, update, view});
const {increment, incrementLater} = types;
const left = Action.wrap('left');
const right = Action.wrap('right');
main.next(left(Action(increment)));
main.next(left(Action(increment)));
main.next(left(Action(increment)));
const act = left(Action(incrementLater));
main.next(act);

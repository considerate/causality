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
// const delay = ms => new Promise(resolve => {
//     setTimeout(resolve, ms);
// });
// const waitAndInc = (ms) => delay(ms).then(() => Action(types.increment));
// const effect = Effect.all(
//     [
//         Effect.call(waitAndInc, 300),
//         Effect.call(waitAndInc, 500)
//     ]
// ).map(actions => {
//     const count = actions.length;
//     console.log({count});
//     return Action(types.incrementBy, count);
// });
// perform(effect).then(a => {
//     console.log({a});
// });
// main.next()
// main.next(left(Action(increment)));
// main.next(left(Action(incrementLater)));
// main.next(left(Action(increment)));
// main.next(right(Action(increment)));

// main.next(left(Action(incrementLater)));
// main.next(left(Action(increment)));
// main.next(left(Action(increment)));

// const actions = new Bus();
// main(actions);
// const incLaterAction = Action('INCREMENT_LATER');
// actions.push(inc);
// actions.push(incLaterAction);
// actions.push(inc);

// const assertEffect = (type, next) => effect => {
//     assert.equal(type, effect.type);
//     return Promise.resolve(next(effect.data));
// };

// const testEffects = (fn,expected,ininitialState) => function*() {
//     let state = ininitialState;
//     let i = 0;
//     while(i < expected.length) {
//         let action = yield; //wait for action
//         while(action) {
//             console.log({action});
//             let [value, effectAssert] = expected[i];
//             const {state: next, effect} = fn(state, action);
//             console.log({next, effect});
//             assert.equal(value, next);
//             state = next;
//             action = yield effectAssert(effect);
//             i++;
//         }
//     }
// };
// const noop = () => {};

// const seq = (fn,promises) => {
//     return promises.reduce((p) => {
//         return Promise.resolve(p).then(fn);
//     }, Promise.resolve());
// };

// const testUpdate = () => {
//     let startState = 4;
//     const expected = [
//         [5, assertEffect('NONE', noop)],
//         [6, assertEffect('NONE', noop)]
//     ];
//     const test = testEffects(update,expected,startState)();
//     const actions = [Action('INCREMENT'), Action('INCREMENT')];
//     actions.reduce((promise, action) => {

//     }, Promise.resolve([]));
//     test.next(Action('INCREMENT'));
//     test.next(Action('INCREMENT'));
// };
// testUpdate();

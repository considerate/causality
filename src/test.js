import {performWith, testPerformer} from './perform.js';
import {Action} from './Action.js';
import {Effect, SideEffect} from './Effect.js';
import {Result} from './Result.js';

const effectEqual = (assert, a, b) => {
    assert(a[SideEffect], String(a));
    assert(b[SideEffect]);
    assert.equal(a.type, b.type);
    const performer = testPerformer(b,assert);
    const perform = performWith(performer);
    return perform(a);
};

export const equalActions = (expected) => (actual) => {
    return new Promise((resolve, reject) => {
        if(actual.length !== expected.length) {
            reject(new Error(`${actual} ≠ ${expected}`));
        } else {
            const allEqual = actual.every((action, i) => {
                return (String(action) === String(expected[i]));
            });
            if(!allEqual) {
                reject(new Error(`${actual} ≠ ${expected}`));
            } else {
                resolve(true);
            }
        }
    });
};

export const testEffects = (fn, assert) => ({
    action,
    state: before,
    expected: {
        state: expectedState,
        effect: expectedEffect=Effect.none,
        actions: expectedActions=[],
    }
}) => {
    const result = fn(before, action);
    const {state, effect} = result;
    assert.equal(state, expectedState);
    return effectEqual(assert, effect, expectedEffect)
    .then(equalActions(expected.actions));
};

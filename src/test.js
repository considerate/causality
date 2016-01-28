import {performWith, testPerformer} from './perform.js';
import {Action} from './Action.js';
import {Effect, SideEffect} from './Effect.js';
import {Result} from './Result.js';
import {Types} from './Types.js';

const effectEqual = (assert, a, b) => {
    assert(a[SideEffect], String(a));
    assert(b[SideEffect]);
    assert.equal(a.type, b.type);
    const performer = testPerformer(b,assert);
    const perform = performWith(performer);
    return perform(a);
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
    .then(actions => {
        assert.equal(actions.length, expectedActions.length, `${actions} ≠ ${expectedActions}`);
        actions.map((action,i) => {
            assert.equal(String(action), String(expectedActions[i]));
        });
    });
};

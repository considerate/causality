// import {performWith, Action, Effect, Types, Result, SideEffect, testPerformer} from '..';

// const effectEqual = (assert, a, b) => {
//     assert(a[SideEffect], String(a));
//     assert(b[SideEffect]);
//     assert.equal(a.type, b.type);
//     const performer = testPerformer(b,assert);
//     const perform = performWith(performer);
//     return perform(a);
// };

// export const testEffects = (fn, assert) => ({
//     action,
//     state: before,
//     expected: {
//         state: expectedState,
//         effect: expectedEffect=Effect.none,
//         actions: expectedActions=[],
//     }
// }) => {
//     const result = fn(before, action);
//     const {state, effect} = result;
//     assert.equal(state, expectedState);
//     return effectEqual(assert, effect, expectedEffect)
//     .then(actions => {
//         actions.map((action,i) => {
//             assert.equal(String(action), String(expectedActions[i]));
//         });
//     });
// };

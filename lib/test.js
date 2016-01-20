'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.testEffects = undefined;

var _ = require('..');

var effectEqual = function effectEqual(assert, a, b) {
    assert(a[_.SideEffect], String(a));
    assert(b[_.SideEffect]);
    assert.equal(a.type, b.type);
    var performer = (0, _.testPerformer)(b, assert);
    var perform = (0, _.performWith)(performer);
    return perform(a);
};

var testEffects = exports.testEffects = function testEffects(fn, assert) {
    return function (_ref) {
        var action = _ref.action;
        var before = _ref.state;
        var _ref$expected = _ref.expected;
        var expectedState = _ref$expected.state;
        var _ref$expected$effect = _ref$expected.effect;
        var expectedEffect = _ref$expected$effect === undefined ? _.Effect.none : _ref$expected$effect;
        var _ref$expected$actions = _ref$expected.actions;
        var expectedActions = _ref$expected$actions === undefined ? [] : _ref$expected$actions;

        var result = fn(before, action);
        var state = result.state;
        var effect = result.effect;

        assert.equal(state, expectedState);
        return effectEqual(assert, effect, expectedEffect).then(function (actions) {
            actions.map(function (action, i) {
                assert.equal(String(action), String(expectedActions[i]));
            });
        });
    };
};
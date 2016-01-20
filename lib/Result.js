'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Result = exports.ResultSymbol = undefined;

var _Effect = require('./Effect.js');

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var ResultSymbol = exports.ResultSymbol = Symbol('result');
var ResultProto = {
    toString: function toString() {
        var state = this.state;
        var effect = this.effect;

        if (effect.type === _Effect.effectTypes.none) {
            return 'Result(' + JSON.stringify(state) + ')';
        }
        return 'Result(\n  ' + JSON.stringify(state) + ',\n  ' + effect.stringify('    ', '  ') + '\n)';
    },
    then: function then(f) {
        var state = this.state;
        var effect = this.effect;

        return f(state, effect);
    }
};
var Result = exports.Result = function Result(state) {
    var effect = arguments.length <= 1 || arguments[1] === undefined ? _Effect.Effect.none : arguments[1];

    var result = Object.create(ResultProto);
    return Object.assign(result, _defineProperty({ state: state, effect: effect }, ResultSymbol, true));
};
Result.all = function (results) {
    var states = [];
    var effects = [];
    results.forEach(function (_ref) {
        var state = _ref.state;
        var effect = _ref.effect;

        states.push(state);
        effects.push(effect);
    });
    return Result(states, effects);
};
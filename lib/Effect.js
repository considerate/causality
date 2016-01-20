'use strict';

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; })();

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Effect = exports.effectTypes = exports.SideEffect = undefined;

var _Types = require('./Types.js');

var _perform = require('./perform.js');

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var SideEffect = exports.SideEffect = Symbol('SideEffect');

var effectTypes = exports.effectTypes = (0, _Types.Types)('none', 'call', 'then', 'all');

var call = function call(fn) {
    for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
    }

    var type = effectTypes.call;
    var data = {
        fn: fn,
        args: args
    };
    return Effect(type, data);
};
var EffectProto = {
    then: function then(fn) {
        var type = this.type;
        var data = this.data;

        return Effect(effectTypes.then, {
            effect: this,
            callback: fn
        });
    },
    map: function map(fn) {
        if (this.type === effectTypes.none) {
            return Effect.none;
        }
        return this.then(function map(a) {
            return call(fn, a);
        });
    },
    stringify: function stringify() {
        var space = arguments.length <= 0 || arguments[0] === undefined ? '  ' : arguments[0];
        var indent = arguments.length <= 1 || arguments[1] === undefined ? '' : arguments[1];
        var type = this.type;
        var data = this.data;

        var name = (0, _Types.typeName)(type);
        if (type === effectTypes.none) {
            return '[Effect ' + name + ']';
        } else if (type === effectTypes.call) {
            var fn = data.fn;
            var args = data.args;

            var fnName = fn.name || 'fn';
            var fnArgs = args.map(function (arg) {
                return space + String(arg);
            }).join(',\n');
            return [name + '(', space + fnName, fnArgs, indent + ')'].join('\n');
        } else if (type === effectTypes.then) {
            var effect = data.effect;
            var callback = data.callback;

            var fnName = callback.name || 'fn';
            var eff = effect.stringify('  ' + space, space);
            return [name + '(', space + eff, space + fnName, indent + ')'].join('\n');
        } else if (type === effectTypes.all) {
            var effects = data.effects;

            var nested = effects.map(function (effect) {
                return space + effect.stringify('  ' + space, space);
            }).join(',\n');
            return [name + '([', nested, indent + '])'].join('\n');
        } else {
            return name + '(' + JSON.stringify(data) + ')';
        }
    },
    toString: function toString() {
        return this.stringify();
    }
};
var Effect = exports.Effect = function Effect(type, data) {
    var _Object$assign;

    var effect = Object.create(EffectProto);
    return Object.assign(effect, (_Object$assign = {}, _defineProperty(_Object$assign, SideEffect, true), _defineProperty(_Object$assign, 'type', type), _defineProperty(_Object$assign, 'data', data), _Object$assign));
};
Effect.types = effectTypes;
Effect.call = call;
var none = Effect(effectTypes.none);
Effect.none = none;

var seq = function seq(effects) {
    var id = function id(x) {
        return x;
    };
    var copy = function copy(arr) {
        return arr.map(id);
    };
    var es = copy(effects);
    var e = es.shift(); //take out the first element
    if (es.length === 0) {
        return e;
    }
    return Effect(effectTypes.then, {
        effect: e,
        callback: function callback() {
            return seq(es);
        }
    });
};
Effect.seq = seq;

var all = function all(effects) {
    if (!Array.isArray(effects)) {
        throw new Error('Need to pass array to Effect.all, got: ' + JSON.stringify(effects));
    }
    if (effects.length === 0) {
        return Effect.none;
    } else if (effects.length === 1) {
        var _effects = _slicedToArray(effects, 1);

        var effect = _effects[0];

        return effect.map(function (a) {
            return [a];
        });
    } else {
        return Effect(effectTypes.all, {
            effects: effects
        });
    }
};
Effect.all = all;
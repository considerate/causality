'use strict';

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; })();

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.performWith = exports.perform = exports.testPerformer = exports.basePerformer = undefined;

var _Types = require('./Types.js');

var _Effect = require('./Effect.js');

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var flatten = function flatten(listOfLists) {
    if (listOfLists.length === 0) {
        return listOfLists;
    } else {
        return listOfLists.reduce(function (result, list) {
            list.forEach(function (elem) {
                return result.push(elem);
            });
            return result;
        }, []);
    }
};

var basePerformer = exports.basePerformer = function basePerformer() {
    var _ref;

    var call = _Effect.effectTypes.call;
    var none = _Effect.effectTypes.none;
    var then = _Effect.effectTypes.then;
    var all = _Effect.effectTypes.all;

    return _ref = {}, _defineProperty(_ref, none, function (effect, perform) {
        return [];
    }), _defineProperty(_ref, then, function (effect, perform) {
        var data = effect.data;
        var first = data.effect;
        var callback = data.callback;
        var testing = data.testing;

        return perform(first).then(function (actions) {
            // List Action
            // callback : List Action -> Effect Action
            if (actions.length === 0) {
                return Promise.resolve([]);
            } else if (actions.length > 1) {
                var _effect = callback(actions);
                return perform(_effect); // : Promise (List Action)
            } else if (actions.length === 1) {
                    var action = actions[0];
                    var _effect2 = callback(action);
                    return perform(_effect2);
                } else {
                    throw new Error('Should not be able to enter here');
                }
        });
    }), _defineProperty(_ref, all, function (effect, perform) {
        var data = effect.data;
        var effects = data.effects;

        var effs = effects.filter(function (eff) {
            return eff.type !== _Effect.effectTypes.none;
        }); // List (Effect Action)
        if (effs.length === 0) {
            return []; // : Promise (List Action)
        } else {
                return Promise.all(effs.map(perform)) // (Promise (List (List Action)))
                .then(flatten); // Promise (List Action)
            }
    }), _defineProperty(_ref, call, function (effect) {
        var data = effect.data;
        var fn = data.fn;
        var args = data.args;

        return Promise.resolve(fn.apply(fn, args)).then(function (action) {
            return [action];
        });
    }), _ref;
};

// The test performer applies effects using the callbacks in the test effect
// to both the test effect and the production effect and asserts that the types are equal for all.
var testPerformer = exports.testPerformer = function testPerformer(otherEffect, assert) {
    var _ref4;

    var call = _Effect.effectTypes.call;
    var none = _Effect.effectTypes.none;
    var then = _Effect.effectTypes.then;
    var all = _Effect.effectTypes.all;

    return _ref4 = {}, _defineProperty(_ref4, none, function (effect) {
        assert.equal(otherEffect.type, none);
    }), _defineProperty(_ref4, then, function (effect) {
        assert.equal(otherEffect.type, then);
        var otherFirst = otherEffect.data.effect;

        var perform = performWith(testPerformer(otherFirst, assert));
        var data = effect.data;
        var first = data.effect;
        var testing = data.testing;

        var callback = otherEffect.data.callback;
        return Promise.all([perform(first), perform(otherFirst)]).then(function (_ref2) {
            var _ref3 = _slicedToArray(_ref2, 2);

            var actions = _ref3[0];
            var oa = _ref3[1];

            if (actions.length === 0) {
                return [];
            } else if (actions.length > 1) {
                var _otherEffect = callback(oa);
                var _perform = performWith(testPerformer(_otherEffect, assert));
                var _effect3 = callback(actions);
                return _perform(_effect3);
            } else if (actions.length === 1) {
                var _otherEffect2 = callback(oa[0]);
                var _perform2 = performWith(testPerformer(_otherEffect2, assert));
                var action = actions[0];
                var _effect4 = callback(action);
                return _perform2(_effect4);
            } else {
                throw new Error('Should not be able to enter here');
            }
        });
    }), _defineProperty(_ref4, all, function (effect) {
        assert.equal(otherEffect.type, all);
        var data = effect.data;
        var effects = data.effects;

        var otherEffects = otherEffect.data.effects;
        return Promise.all(effects.map(function (effect, i) {
            var other = otherEffects[i];
            var perform = performWith(testPerformer(other, assert));
            return perform(effect);
        })).then(flatten);
    }), _defineProperty(_ref4, call, function (effect) {
        var data = effect.data;
        var args = data.args;

        var fn = otherEffect.data.fn;
        return Promise.resolve(fn.apply(fn, args)).then(function (action) {
            return [action];
        });
    }), _ref4;
};

var perform = exports.perform = function perform(effect) {
    return performWith(basePerformer);
};

// perform : Effect Action -> Promise (List Action)
var performWith = exports.performWith = function performWith(performer) {
    return function (effect) {
        var perform = performWith(performer);
        var type = effect.type;
        var data = effect.data;

        var effectPerformer = performer[type];
        return Promise.resolve().then(function () {
            if (!effectPerformer) {
                var name = (0, _Types.typeName)(type);
                throw new Error('No performer for type ' + name + ', ' + String(effect));
            } else {
                return Promise.resolve(effectPerformer(effect, perform)).then(function (actions) {
                    if (!Array.isArray(actions)) {
                        return [actions];
                    } else {
                        return actions;
                    }
                });
            };
        });
    };
};
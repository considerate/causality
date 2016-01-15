'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Action = undefined;

var _Types = require('./Types.js');

var ActionProto = {
    toString: function toString() {
        var type = this.type;
        var data = this.data;

        var name = (0, _Types.typeName)(type);
        if (data) {
            var action = data.action;

            if (action) {
                return 'Action(' + name + ', ' + String(data.action) + ')';
            } else {
                return 'Action(' + name + ', ' + String(data) + ')';
            }
        } else {
            return 'Action(' + name + ')';
        }
    }
};
var Action = exports.Action = function Action(type, data) {
    var action = Object.create(ActionProto);
    return Object.assign(action, { type: type, data: data });
};
var wrap = function wrap(type, data) {
    return function (action) {
        return Action(type, Object.assign(data || {}, { action: action }));
    };
};
var unwrap = function unwrap(_ref) {
    var action = _ref.data.action;
    return action;
};
Action.wrap = wrap;
Action.unwrap = unwrap;
'use strict';

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; })();

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Effect = exports.effectTypes = undefined;

var _Types = require('./Types.js');

var _perform = require('./perform.js');

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var SideEffect = Symbol('SideEffect');

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
    }
};
var Result = exports.Result = function Result(state) {
    var effect = arguments.length <= 1 || arguments[1] === undefined ? _Effect.Effect.none : arguments[1];

    var result = Object.create(ResultProto);
    return Object.assign(result, _defineProperty({ state: state, effect: effect }, ResultSymbol, true));
};
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

function _typeof(obj) { return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj; }

var typeName = exports.typeName = function typeName(type) {
    return (typeof type === 'undefined' ? 'undefined' : _typeof(type)) === 'symbol' ? Symbol.keyFor(type) : String(type);
};

var Types = exports.Types = function Types() {
    for (var _len = arguments.length, list = Array(_len), _key = 0; _key < _len; _key++) {
        list[_key] = arguments[_key];
    }

    return list.reduce(function (obj, type) {
        obj[type] = Symbol.for(type);
        return obj;
    }, {});
};
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Action = exports.Result = exports.Types = exports.Effect = undefined;

var _zenObservable = require('zen-observable');

var _zenObservable2 = _interopRequireDefault(_zenObservable);

var _Effect = require('./lib/Effect.js');

var _Types = require('./lib/Types.js');

var _Result = require('./lib/Result.js');

var _Action = require('./lib/Action.js');

var _perform = require('./lib/perform.js');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.Effect = _Effect.Effect;
exports.Types = _Types.Types;
exports.Result = _Result.Result;
exports.Action = _Action.Action;

var noop = function noop() {};

var app = function app(options) {
    var defaults = {
        view: noop
    };

    var _Object$assign = Object.assign(defaults, options);

    var init = _Object$assign.init;
    var update = _Object$assign.update;
    var view = _Object$assign.view;

    var next = undefined;
    var actions = new _zenObservable2.default(function (observer) {
        next = observer.next.bind(observer);
    });
    var handleEffect = function handleEffect(effect) {
        (0, _perform.perform)(effect).then(function (actions) {
            actions.forEach(next);
        }).catch(function (error) {
            console.error(error.stack);
        });
    };
    var result = init();
    // console.log(String(result));
    var state = result.state;
    var effect = result.effect;

    view(state);
    handleEffect(effect);
    actions.forEach(function (action) {
        var type = action.type;

        var result = update(state, action);
        if (!result[_Result.ResultSymbol]) {
            throw new Error('Unhandled action type ' + type + ' for action ' + JSON.stringify(action));
        }
        var nextState = result.state;
        var effect = result.effect;
        // console.log(String(result));

        state = nextState;
        if (effect.type !== _Effect.effectTypes.none) {
            handleEffect(effect);
        }
        view(state);
    }).catch(function (error) {
        console.error(error);
        console.error(error.stack);
    });
    return {
        next: next
    };
};
_Effect.Effect.app = app;
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.perform = undefined;

var _Effect = require('./Effect.js');

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
// perform : Effect Action -> Promise (List Action)
var perform = exports.perform = function perform(effect) {
    var type = effect.type;
    var data = effect.data;

    return new Promise(function (resolve, reject) {
        if (type === _Effect.effectTypes.none) {
            resolve([]); // : Promise (List Action)
        } else if (type === _Effect.effectTypes.call) {
                var fn = data.fn;
                var args = data.args;

                var promise = Promise.resolve(fn.apply(fn, args)).then(function (action) {
                    return [action];
                });
                resolve(promise); // : Promise (List Action)
            } else if (type === _Effect.effectTypes.then) {
                    (function () {
                        var first = data.effect;
                        var callback = data.callback;
                        var testing = data.testing;

                        resolve(perform(first).then(function (actions) {
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
                        }));
                    })();
                } else if (type === _Effect.effectTypes.all) {
                    var effects = data.effects;

                    var effs = effects.filter(function (eff) {
                        return eff.type !== _Effect.effectTypes.none;
                    }); // List (Effect Action)
                    if (effs.length === 0) {
                        resolve([]); // : Promise (List Action)
                    } else {
                            resolve(Promise.all(effs.map(perform)) // (Promise (List (List Action)))
                            .then(flatten) // Promise (List Action)
                            );
                        }
                }
    }).then(function (actions) {
        return actions;
    });
};

//# sourceMappingURL=effect.js.map
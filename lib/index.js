'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.testEffects = exports.performWith = exports.testPerformer = exports.basePerformer = exports.SideEffect = exports.Action = exports.Result = exports.Types = exports.Effect = undefined;

var _zenObservable = require('zen-observable');

var _zenObservable2 = _interopRequireDefault(_zenObservable);

var _Effect = require('./Effect.js');

var _Types = require('./Types.js');

var _Result = require('./Result.js');

var _Action = require('./Action.js');

var _perform = require('./perform.js');

var _test = require('./test.js');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.Effect = _Effect.Effect;
exports.Types = _Types.Types;
exports.Result = _Result.Result;
exports.Action = _Action.Action;
exports.SideEffect = _Effect.SideEffect;
exports.basePerformer = _perform.basePerformer;
exports.testPerformer = _perform.testPerformer;
exports.performWith = _perform.performWith;
exports.testEffects = _test.testEffects;

var noop = function noop() {};
var nextTick = function nextTick(f) {
    return setTimeout(f, 0);
};

var app = function app(options) {
    var defaults = {
        view: noop
    };

    var _Object$assign = Object.assign(defaults, options);

    var init = _Object$assign.init;
    var update = _Object$assign.update;
    var view = _Object$assign.view;
    var customPerformer = _Object$assign.performer;
    var inputs = _Object$assign.inputs;
    var onView = _Object$assign.onView;

    var base = (0, _perform.basePerformer)();
    var performer = Object.assign({}, base, customPerformer);
    var viewListeners = [];
    var startListeners = [];
    var started = false;
    var initialView = undefined;
    var app = {
        onView: function onView(f) {
            viewListeners.push(f);
        },
        onStart: function onStart(f) {
            if (started) {
                f(initialView);
            } else {
                startListeners.push(f);
            }
        },
        use: function use(middleware, data) {
            middleware(app, data);
        },
        start: function start() {
            var next = undefined;
            var perform = (0, _perform.performWith)(performer);
            var actions = new _zenObservable2.default(function (observer) {
                next = observer.next.bind(observer);
                if (inputs && typeof inputs.forEach === 'function') {
                    inputs.forEach(next);
                }
            });
            var handleEffect = function handleEffect(effect) {
                perform(effect).then(function (actions) {
                    actions.forEach(next);
                }).catch(function (error) {
                    console.error(error.stack);
                });
            };
            actions.forEach(function (action) {
                var type = action.type;

                var result = update(state, action);
                if (!result || !result[_Result.ResultSymbol]) {
                    throw new Error('Unhandled action type ' + (0, _Types.typeName)(type) + ' for action ' + String(action));
                }
                var nextState = result.state;
                var effect = result.effect;

                state = nextState;
                if (effect.type !== _Effect.effectTypes.none) {
                    handleEffect(effect);
                }
                var rendered = view(state, next);
                viewListeners.forEach(function (handler) {
                    return handler(rendered, next);
                });
            }).catch(function (error) {
                console.error(error);
                console.error(error.stack);
            });

            var result = init();
            var state = result.state;
            var effect = result.effect;

            initialView = view(state, next);
            started = true;
            startListeners.forEach(function (handler) {
                return handler(initialView);
            });
            nextTick(function () {
                handleEffect(effect);
            });
        }
    };
    return app;
};
_Effect.Effect.app = app;
import Observable from 'zen-observable';
import {Types, typeName} from './Types.js';
import {Result, ResultSymbol} from './Result.js';
import {Action} from './Action.js';
import {performWith, basePerformer, testPerformer} from './perform.js';
import {testEffects, equalActions} from './test.js';

import {NONE} from './EffectTypes.js';
import {Effect, SideEffect} from './Effect.js';

const noop = () => {};
const nextTick = (f) => setTimeout(f, 0);

const app = (options) => {
    const defaults = {
        view: noop
    };
    const {init, update, view, performer: customPerformer, inputs, onView} = Object.assign(defaults, options);
    const performer = Object.assign({}, basePerformer, customPerformer);
    const viewListeners = [];
    const startListeners = [];
    let started = false;
    let initialView;
    const app = {
        onView: (f) => {
            viewListeners.push(f);
        },
        onStart: (f) => {
            if(started) {
                f(initialView);
            } else {
                startListeners.push(f);
            }
        },
        use: (middleware, data) => {
            middleware(app, data);
        },
        start: () => {
            let next;
            const perform = performWith(performer);
            const actions = new Observable(observer => {
                next = observer.next.bind(observer);
                if(inputs && typeof inputs.forEach === 'function') {
                    inputs.forEach(next);
                }
            });
            const handleEffect = (effect, action) => {
                return perform(effect)
                .then(actions => {
                    actions.forEach(next);
                })
                .catch(error => {
                    if(action && action.type === 'error') {
                        //Avoid stack-overflows
                    } else {
                        next(Action('error', {error,effect,action}));
                    }
                });
            };
            actions.forEach(action => {
                const {type} = action;
                const result = update(state, action);
                if(!result || result.state === undefined) {
                    const error = new Error(`Unhandled action type ${typeName(type)} for action ${String(action)}`);
                    if(action.type !== 'error') {
                        next(Action('error', {error}));
                    }
                }
                const {state: nextState, effect} = result;
                state = nextState;
                if(effect && effect.type !== NONE) {
                    handleEffect(effect,action);
                }
                const rendered = view(state, next);
                viewListeners.forEach(handler => handler(rendered, next));
            })
            .catch(error => {
                console.error(error);
                console.error(error.stack);
            });

            const result = init();
            let {state, effect} = result;
            initialView = view(state, next);
            started = true;
            startListeners.forEach(handler => handler(initialView));
            nextTick(() => {
                handleEffect(effect);
            });
        }
    };
    return app;
};
Effect.app = app;

export {Effect, Result, Action, basePerformer, testPerformer, performWith, testEffects, equalActions};

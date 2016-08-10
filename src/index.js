import Observable from 'zen-observable';
import Result from './Results.js';
import Action from './Actions.js';

import {NONE} from './EffectTypes.js';
import Effect, * as Effects from './Effects.js';

const noop = () => {};
const nextTick = (f) => setTimeout(f, 0);

const App = (options) => {
    const {
        init,
        update,
        view = noop,
        performers: customPerformers,
        inputs,
        onView,
    } = options;
    const viewListeners = [];
    let startListeners = [];
    let started = false;
    let initialView;
    const perform = customPerformers ? Effects.performer(customPerformers)
        : Effects.performer();
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
                    const error = new Error(`Unhandled action type ${type} for action ${action}`);
                    if(action.type !== 'error') {
                        next(Action('error', {error}));
                    }
                }
                const {state: nextState, effect} = result;
                state = nextState;
                if(effect && effect.type !== NONE) {
                    handleEffect(effect, action);
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
            // Call and clear startListeners
            startListeners.forEach(handler => handler(initialView));
            startListeners = [];
            nextTick(() => {
                handleEffect(effect);
            });
        }
    };
    return app;
};

export {
    App,
    Effect,
    Effects,
    Result,
    Action,
};

import Observable from 'zen-observable';
import Result from './Results.js';
import Action from './Actions.js';

import {NONE} from './CauseTypes.js';
import Cause, * as Causes from './Causes.js';

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
    const perform = customPerformers ? Causes.performer(customPerformers)
        : Causes.performer();
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
            const handleCause = (cause, action) => {
                return perform(cause)
                .then(actions => {
                    actions.forEach(next);
                })
                .catch(error => {
                    console.error(error);
                    if(action && action.type === 'error') {
                        //Avoid stack-overflows
                    } else {
                        next(Action('error', {error,cause,action}));
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
                const {state: nextState, cause} = result;
                state = nextState;
                if(cause && cause.type !== NONE) {
                    handleCause(cause, action);
                }
                const rendered = view(state, next);
                viewListeners.forEach(handler => handler(rendered, next));
            })
            .catch(error => {
                console.error(error);
                console.error(error.stack);
            });

            const result = init();
            let {state, cause} = result;
            initialView = view(state, next);
            started = true;
            // Call and clear startListeners
            startListeners.forEach(handler => handler(initialView));
            startListeners = [];
            nextTick(() => {
                handleCause(cause);
            });
        }
    };
    return app;
};

export {
    App,
    Cause,
    Causes,
    Result,
    Action,
};

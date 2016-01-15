import Observable from 'zen-observable';
import {Effect, effectTypes} from './Effect.js';
import {Types} from './Types.js';
import {Result, ResultSymbol} from './Result.js';
import {Action} from './Action.js';
import {perform} from './perform.js';

export {Effect, Types, Result, Action};

const noop = () => {};

const app = (options) => {
    const defaults = {
        view: noop
    };
    const {init, update, view} = Object.assign(defaults, options);
    let next;
    const actions = new Observable(observer => {
        next = observer.next.bind(observer);
    });
    const handleEffect = effect => {
        perform(effect)
        .then(actions => {
            actions.forEach(next);
        })
        .catch(error => {
            console.error(error.stack);
        });
    };
    const result = init();
    // console.log(String(result));
    let {state, effect} = result;
    view(state);
    handleEffect(effect);
    actions.forEach(action => {
        const {type} = action;
        const result = update(state, action);
        if(!result || !result[ResultSymbol]) {
            throw new Error(`Unhandled action type ${type} for action ${String(action)}`);
        }
        const {state: nextState, effect} = result;
        // console.log(String(result));
        state = nextState;
        if(effect.type !== effectTypes.none) {
            handleEffect(effect);
        }
        view(state);
    })
    .catch(error => {
        console.error(error);
        console.error(error.stack);
    });
    return {
        next
    };
}
Effect.app = app;


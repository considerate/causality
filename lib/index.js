import Observable from 'zen-observable';
import {Effect, effectTypes, SideEffect} from './Effect.js';
import {Types, typeName} from './Types.js';
import {Result, ResultSymbol} from './Result.js';
import {Action} from './Action.js';
import {performWith, basePerformer, testPerformer} from './perform.js';

import {testEffects} from './test.js';

export {Effect, Types, Result, Action, SideEffect, basePerformer, testPerformer, performWith, testEffects};

const noop = () => {};

const app = (options) => {
    const defaults = {
        view: noop
    };
    const {init, update, view, performer: customPerformer} = Object.assign(defaults, options);
    const base = basePerformer();
    const performer = Object.assign({},base,customPerformer);
    const perform = performWith(performer);
    let next;
    const actions = new Observable(observer => {
        next = observer.next.bind(observer);
    });
    const handleEffect = (effect) => {
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
            throw new Error(`Unhandled action type ${typeName(type)} for action ${String(action)}`);
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


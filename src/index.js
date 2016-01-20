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
    const {init, update, view, performer: customPerformer, inputs, onView} = Object.assign(defaults, options);
    const base = basePerformer();
    const performer = Object.assign({},base,customPerformer);
    const perform = performWith(performer);
    let next;
    const actions = new Observable(observer => {
        next = observer.next.bind(observer);
        if(inputs && typeof inputs.forEach === 'function') {
            inputs.forEach(next);
        }
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
    actions.forEach(action => {
        const {type} = action;
        const result = update(state, action);
        if(!result || !result[ResultSymbol]) {
            throw new Error(`Unhandled action type ${typeName(type)} for action ${String(action)}`);
        }
        const {state: nextState, effect} = result;
        state = nextState;
        if(effect.type !== effectTypes.none) {
            handleEffect(effect);
        }
        const rendered = view(state, next);
        if(typeof onView === 'function') {
            onView(rendered);
        }
    })
    .catch(error => {
        console.error(error);
        console.error(error.stack);
    });

    const result = init();
    let {state, effect} = result;
    const initialView = view(state, next);
    handleEffect(effect);

    return {
        initialView,
    };
};
Effect.app = app;


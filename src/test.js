import {performWith, testPerformer} from './perform.js';
import {Action} from './Action.js';
import {Effect, SideEffect} from './Effect.js';
import {Result} from './Result.js';

export const equalActions = (expected) => (actual) => {
    if(actual.length !== expected.length) {
        throw new Error(`${actual} ≠ ${expected}`);
    } else {
        const allEqual = actual.every((action, i) => {
            return (String(action) === String(expected[i]));
        });
        if(!allEqual) {
            throw new Error(`${actual} ≠ ${expected}`);
        } else {
            return actual;
        }
    }
};

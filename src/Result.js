import {Effect,effectTypes} from './Effect.js';

// type Result = {state, effect}

export const ResultSymbol = Symbol('result');
const ResultProto = {
    toString() {
        const {state, effect} = this;
        if(effect.type === effectTypes.none) {
            return 'Result('+JSON.stringify(state)+')';
        }
        return 'Result(\n  '+JSON.stringify(state)+',\n  '+effect.stringify('    ', '  ')+'\n)';
    },
    then(f) {
        const {state, effect} = this;
        return f(state, effect);
    },
};
export const Result = (state, effect=Effect.none) => {
    const result = Object.create(ResultProto);
    result.state = state;
    result.effect = effect;
    result[ResultSymbol] = true;
    return result;
};
Result.all = (results) => {
    const states = [];
    const effects = [];
    results.forEach(({state, effect}) => {
        states.push(state);
        effects.push(effect);
    });
    return Result(states, effects);
};

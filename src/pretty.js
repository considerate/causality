import {APPLY, NONE, ALL} from './CauseTypes.js';

export const causeString = (cause) => {
    const {type, data} = cause;
    const name = type;
    if(type === NONE) {
        return `[Cause ${name}]`;
    } else if(type === APPLY) {
        const {f, x} = data;
        return `${name}(${f}, ${x})`;
    } else if (type === ALL) {
        const {effects} = data;
        const nested = effects.map(String).join(', ');
        return `${name}([${nested}])`;
    } else {
        const value = (data && data.name) ? data.name : String(data);
        return `${name}(${value})`;
    }
};

export const actionString = (action) => {
    const {type: name, data} = action;
    if(data) {
        const {action: inner} = data;
        if(inner) {
            return `Action(${name}, ${inner})`;
        } else {
            let dataString = String(data);
            if(dataString === '[object Object]') {
                dataString = JSON.stringify(data);
            }
            return `Action(${name}, ${dataString})`;
        }
    } else {
        return `Action(${name})`;
    }
};

export const resultString = (result) => {
    const {state, cause} = this;
    const stateString = JSON.stringify(state);
    if(cause.type === NONE) {
        return `Result(${stateString})`;
    }
    return `Result(${stateString}, ${effect})`;
};

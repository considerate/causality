import * as Effects from './Effects.js';
import {resultString} from './pretty.js';

export const ResultSymbol = Symbol('result');
const ResultProto = {
    toString() {
        return resultString(this);
    },
};

const Result = (state, effect=Effects.none) => {
    const result = Object.create(ResultProto);
    result.state = state;
    result.effect = effect;
    result[ResultSymbol] = true;
    return result;
};

export default Result;

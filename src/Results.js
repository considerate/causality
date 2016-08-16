import * as Causes from './Causes.js';
import {resultString} from './pretty.js';

export const ResultSymbol = Symbol('result');
const ResultProto = {
    toString() {
        return resultString(this);
    },
};

const Result = (state, cause=Causes.none) => {
    const result = Object.create(ResultProto);
    result.state = state;
    result.cause = cause;
    result[ResultSymbol] = true;
    return result;
};

export default Result;

import {performWith, basePerformer, performer} from './perform.js';
import {causeString} from './pretty.js';
import {NONE, APPLY, ALL, PURE} from './CauseTypes.js';

export {performWith, basePerformer, performer};

export const Sidecause = Symbol('Sidecause');

const CauseProto = {
    map(fn) {
        const mapped = apply(Cause(fn), this);
        return mapped;
    },
    toString() {
        return causeString(this);
    }
};

export const all = (causes) => {
    if(!Array.isArray(causes)) {
        throw new Error(`Need to pass array to Causes.all, got: ${JSON.stringify(causes)}`);
    }
    if (causes.length === 1) {
        const [cause] = causes;
        return cause;
    } else {
        return createCause(
            ALL,
            {
                causes,
            }
        );
    }
};

export const apply = (f, x) => {
    if(f.type === ALL) {
        const {causes} = f.data;
        const applications = causes.map((e) => apply(e, x));
        return all(applications)
    } else if(x.type === ALL) {
        const {causes} = x.data;
        const applications = causes.map((e) => apply(f, e));
        return all(applications);
    } else if(f.type === PURE) {
        if(x.type === PURE) {
            return Cause(f.data(x.data));
        }
        // else if(x.type === APPLY && x.data.f.type === PURE) {
        //     const {f: f2, x : x2} = x.data;
        //     const ap = (g) => g(f2.data);
        //     const application = Cause(ap);
        //     const top = apply(application, f2);
        //     return apply(top, x2);
        // }
        else if (x[Sidecause]) {
            return createCause(APPLY, {
                f,
                x,
            });
        } else {
            throw new Error(`Causes.apply expects both arguments to be Causes, got (${f}, ${x}).`);
        }
    } else if(x.type === PURE) {
        const ap = (g) => g(x.data);
        const application = Cause(ap);
        return apply(application, f);
    } else if(f.type === NONE) {
        return x;
    } else if (f[Sidecause] && x[Sidecause]) {
        return createCause(APPLY, {
            f,
            x,
        });
    } else {
        throw new Error(`Causes.apply expects both arguments to be Causes, got (${f}, ${x}).`);
    }
};

const createCause = (type, data, performer) => {
    const cause = Object.create(CauseProto);
    cause[Sidecause] = true;
    return Object.assign(cause, {type, data, performer});
};

export const create = createCause;

export const compose = (...causes) =>
    causes.reduceRight((b, a) => apply(a, b));

export const sequence = (...causes) =>
    causes.reduce((a, b) => apply(b, a));

export const seq = sequence;

export const none = all([]); //createCause(NONE);

function Cause(data) {
    if(data[Sidecause] === true) {
        //Cause(Cause(x)) == Cause(x);
        return data;
    } else {
        return createCause(PURE, data);
    }
}

export default Cause;

import {perform} from './perform.js';
import {effectString} from './pretty.js';
import {NONE, APPLY, ALL, CREATE} from './EffectTypes.js';

export const SideEffect = Symbol('SideEffect');

export const apply = (f, x) => {
    if(f.type === ALL) {
        const {effects} = f.data;
        const applications = effects.map((e) => apply(e, x));
        return Effect.all(applications)
    } else if(x.type === ALL) {
        const {effects} = x.data;
        const applications = effects.map((e) => apply(f, e));
        return Effect.all(applications);
    } else if(f.type === CREATE) {
        if(x.type === CREATE) {
            return Effect(f.data(x.data));
        } else if (x[SideEffect]) {
            return createEffect(APPLY, {
                f,
                x,
            });
        } else {
            throw new Error(`Effect.apply expects both arguments to be Effects, got (${f}, ${x}).`);
        }
    } else if(x.type === CREATE) {
        const ap = (g) => g(x.data);
        const application = Effect(ap);
        return apply(application, f);
    } else if(f.type === NONE) {
        return x;
    } else if (f[SideEffect] && x[SideEffect]) {
        return createEffect(APPLY, {
            f,
            x,
        });
    } else {
        throw new Error(`Effect.apply expects both arguments to be Effects, got (${f}, ${x}).`);
    }
};

const call = (fn, x) => {
    return apply(Effect(fn), Effect(x));
};

const createEffect = (type, data, performer) => {
    const effect = Object.create(EffectProto);
    effect[SideEffect] = true;
    return Object.assign(effect, {type, data, performer});
};

export const Effect = (data) => {
    if(data[SideEffect] === true) {
        //Effect(Effect(x)) == Effect(x);
        return data;
    } else {
        return createEffect(CREATE, data);
    }
}
Effect.create = createEffect;

var EffectProto = {
    map(fn) {
        const mapped = apply(Effect(fn), this);
        return mapped;
    },
    toString() {
        return effectString(this);
    }
};
Effect.apply = apply;
Effect.compose = (...effects) =>
    effects.reduceRight((b, a) => apply(a, b));
Effect.sequence = (...effects) =>
    effects.reduce((a, b) => apply(b, a));
Effect.seq = Effect.sequence;

Effect.call = call;

const none = createEffect(NONE);
Effect.none = none;

const all = (effects) => {
    if(!Array.isArray(effects)) {
        throw new Error(`Need to pass array to Effect.all, got: ${JSON.stringify(effects)}`);
    }
    if(effects.length === 0) {
        return Effect.none;
    } else if(effects.length === 1) {
        const [effect] = effects;
        return effect;
    } else {
        return createEffect(
            ALL,
            {
                effects,
            }
        );
    }
};
Effect.all = all;

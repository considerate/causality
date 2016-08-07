import {perform} from './perform.js';
import {effectJSON} from './json.js';
import {NONE, APPLY, ALL, CREATE} from './EffectTypes.js';

export const SideEffect = Symbol('SideEffect');

export const apply = (f, x) => {
    if(f.type === CREATE) {
        if(x.type === CREATE) {
            return Effect(f(x));
        } else {
            return createEffect(APPLY, {
                f,
                x,
            });
        }
    } else if(x.type === CREATE) {
        const fn = (f) => f(x);
        return apply(Effect(fn), f);
    } else if(f.type === NONE) {
        return x;
    } else {
        return createEffect(APPLY, {
            f,
            x,
        });
    }
};

const call = (fn, x) => {
    return apply(fn, Effect(x));
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
    stringify(space='  ', indent='') {
        return effectJSON(effectTypes)(this, space, indent);
    },
    toString() {
        return this.stringify();
    }
};
Effect.call = call;

const none = createEffect(NONE);
Effect.none = none;

const seq = (effects) => {
    throw new Error(`Effect.seq is deprecated.
    Please use effect.map() instead.`);
};
Effect.seq = seq;

const all = (effects) => {
    if(!Array.isArray(effects)) {
        throw new Error(`Need to pass array to Effect.all, got: ${JSON.stringify(effects)}`);
    }
    if(effects.length === 0) {
        return Effect.none;
    } else if(effects.length === 1) {
        const [effect] = effects;
        return effect.map(a => {
            return [a];
        });
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

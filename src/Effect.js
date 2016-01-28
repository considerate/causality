import {Types, typeName} from './Types.js';
import {perform} from './perform.js';

export const SideEffect = Symbol('SideEffect');

export const effectTypes = Types('none', 'call', 'then', 'all');

const call = (fn, ...args) => {
    const type = effectTypes.call;
    const data = {
        fn,
        args,
    };
    return Effect(type, data);
};

export const Effect = (type, data) => {
    const effect = Object.create(EffectProto);
    effect.type = type;
    effect.data = data;
    effect[SideEffect] = true;
    return effect;
};

var EffectProto = {
    then(fn) {
        const {type, data} = this;
        return Effect(
            effectTypes.then,
            {
                effect: this,
                callback: fn,
            }
        );
    },
    map(fn) {
        if(this.type === effectTypes.none) {
            return Effect.none;
        }
        const result = this.then(function map(x) {
            return call(fn, x);
        });
        return result;
    },
    stringify(space='  ', indent='') {
        const {type, data} = this;
        const name = typeName(type);
        if(type === effectTypes.none) {
            return `[Effect ${name}]`;
        } else if(type === effectTypes.call) {
            const {fn, args} = data;
            const fnName = fn.name || 'fn';
            const fnArgs = args.map(arg => {
                return space+String(arg);
            }).join(',\n');
            return [
                name+'(',
                space + fnName,
                fnArgs,
                indent+ ')'
            ].join('\n');
        } else if(type === effectTypes.then) {
            const {effect, callback} = data;
            const fnName = callback.name || 'fn';
            const eff = effect.stringify('  '+space, space);
            return [
                name+'(',
                space+eff,
                space+fnName,
                indent+ ')'
            ].join('\n');
        } else if (type === effectTypes.all) {
            const {effects} = data;
            const nested = effects.map(effect => {
                return space+effect.stringify('  '+space, space);
            }).join(',\n');
            return [
                name+'([',
                nested,
                indent+'])'
            ].join('\n');
        } else {
            return name+'('+JSON.stringify(data)+')';
        }
    },
    toString() {
        return this.stringify();
    }
};
Effect.types = effectTypes;
Effect.call = call;

const none = Effect(effectTypes.none);
Effect.none = none;

const seq = (effects) => {
    const id = x => x;
    const copy = arr => arr.map(id);
    const es = copy(effects);
    const e = es.shift(); //take out the first element
    if(es.length === 0) {
        return e;
    }
    return Effect(
        effectTypes.then,
        {
            effect: e,
            callback: () => seq(es),
        }
    );
};
Effect.seq = seq;

const all = (effects) => {
    if(!Array.isArray(effects)) {
        throw new Error('Need to pass array to Effect.all, got: '+JSON.stringify(effects));
    }
    if(effects.length === 0) {
        return Effect.none;
    } else if(effects.length === 1) {
        const [effect] = effects;
        return effect.map(a => {
            return [a];
        });
    } else {
        return Effect(
            effectTypes.all,
            {
                effects,
            }
        );
    }
};
Effect.all = all;

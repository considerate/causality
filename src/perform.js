import {typeName} from './Types.js';
import {Effect} from './Effect.js';
import {NONE, CREATE, APPLY, ALL} from './EffectTypes.js';

const flatten = (listOfLists) => {
    if(listOfLists.length === 0) {
        return listOfLists;
    } else {
        return listOfLists.reduce((result, list) => {
            list.forEach(elem => result.push(elem));
            return result;
        }, []);
    }
};

const defined = (x) => x !== undefined && x !== null;

const forceArray = (actions) => {
    if(!Array.isArray(actions)) {
        return [actions];
    } else {
        return actions;
    }
};

export const basePerformer = () => ({
    [CREATE]: (data, perform) => {
        return Promise.resolve([data]);
    },
    [NONE]: (data, perform) => {
        return Promise.resolve([]);
    },
    [APPLY]: (data, perform) => {
        const {f, x} = data;
        //apply effect in Promise monad by lifiting the result of f(x).
        return Promise.all([
            perform(f),
            perform(x)
        ]).then(([functions, values]) => {
            const result = [];
            functions.forEach(f =>
                values.forEach(v =>
                    result.push(f(v))));
            return result;
        });
    },
    [ALL]: (data, perform) => {
        const {effects}  = data;
        const effs = effects.filter(eff => defined(eff) && eff.type !== NONE); // List (Effect Action)
        if(effs.length === 0) {
            return Promise.resolve([]); // : Promise (List Action)
        } else {
            return Promise.all(effs.map(perform)) // (Promise (List (List Action)))
                .then(flatten); // Promise (List Action)
        }
    },
});

const customPerformer = (effect) => ({
    [effect.type]: effect.performer,
});

export const performer = (...extraPerformers) =>
    performWith(basePerformer, ...extraPerformers, customPerformer);

const call = (x) => (f) => f(x);

// perform : Effect Action -> Promise (List Action)
export const performWith = (...performers) => (effect) => {
    const {type} = effect;
    const effectPerformer = performers.map(call(effect)).find((p) => defined(p[type]));
    if(!effectPerformer) {
        const name = typeName(type);
        return Promise.reject(new Error(`No performer for type ${name}, ${String(effect)}, ${JSON.stringify(performer)}`));
    } else {
        const {data} = effect;
        const performer = effectPerformer[type];
        const perform = performWith(...performers);
        const result = performer(data, perform);
        return Promise.resolve(result).then(forceArray);
    };
};

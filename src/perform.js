import {typeName} from './Types.js';
import {Effect,effectTypes} from './Effect.js';

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

export const basePerformer = () => {
    const {call, none, then, all} = effectTypes;
    return {
        [none]: (effect, perform) => {
            return [];
        },
        [then]: (effect, perform) => {
            const {data} = effect;
            const {effect: first, callback, testing} = data;
            return perform(first).then(actions => { // List Action
                // callback : List Action -> Effect Action
                if(actions.length === 0) {
                    return Promise.resolve([]);
                }
                else if(actions.length > 1) {
                    const effect = callback(actions);
                    return perform(effect); // : Promise (List Action)
                } else if(actions.length === 1) {
                    const action = actions[0];
                    const effect = callback(action);
                    return perform(effect);
                } else {
                    throw new Error('Should not be able to enter here');
                }
            });
        },
        [all]: (effect, perform) => {
            const {data} = effect;
            const {effects}  = data;
            const effs = effects.filter(eff => eff.type !== effectTypes.none); // List (Effect Action)
            if(effs.length === 0) {
                return []; // : Promise (List Action)
            } else {
                return Promise.all(effs.map(perform)) // (Promise (List (List Action)))
                .then(flatten) // Promise (List Action)
            }
        },
        [call]: (effect) => {
            const {data} = effect;
            const {fn, args} = data;
            return Promise.resolve(fn.apply(fn,args))
            .then(action => {
                if(!Array.isArray(action)) {
                    return [action];
                } else {
                    const actions = action; // Multiple actions returned
                    return actions;
                }
            });
        },
    };
};

// The test performer applies effects using the callbacks in the test effect
// to both the test effect and the production effect and asserts that the types are equal for all.
export const testPerformer = (otherEffect, assert) => {
    const {call, none, then, all} = effectTypes;
    return {
        [none]: (effect) => {
            assert.equal(otherEffect.type, none);
        },
        [then]: (effect) => {
            assert.equal(otherEffect.type, then);
            const {effect: otherFirst} = otherEffect.data;
            const perform = performWith(testPerformer(otherFirst, assert));
            const {data} = effect;
            const {effect: first, testing} = data;
            const callback = otherEffect.data.callback;
            return Promise.all([perform(first), perform(otherFirst)])
            .then(([actions, oa]) => {
                if(actions.length === 0) {
                    return [];
                }
                else if(actions.length > 1) {
                    const otherEffect = callback(oa);
                    const perform = performWith(testPerformer(otherEffect, assert));
                    const effect = callback(actions);
                    return perform(effect);
                } else if(actions.length === 1) {
                    const otherEffect = callback(oa[0]);
                    const perform = performWith(testPerformer(otherEffect, assert));
                    const action = actions[0];
                    const effect = callback(action);
                    return perform(effect);
                } else {
                    throw new Error('Should not be able to enter here');
                }
            });
        },
        [all]: (effect) => {
            assert.equal(otherEffect.type, all);
            const {data} = effect;
            const {effects}  = data;
            const otherEffects = otherEffect.data.effects;
            return Promise.all(effects.map((effect,i) => {
                const other = otherEffects[i];
                const perform = performWith(testPerformer(other, assert));
                return perform(effect);
            }))
            .then(flatten)
        },
        [call]: (effect) => {
            const {data} = effect;
            const {args} = data;
            const fn = otherEffect.data.fn;
            return Promise.resolve(fn.apply(fn,args))
            .then(action => {
                if(!Array.isArray(action)) {
                    return [action];
                } else {
                    const actions = action; // Multiple actions returned
                    return actions;
                }
            });
        }
    };
};

export const perform = (effect) => {
    return performWith(basePerformer);
};

// perform : Effect Action -> Promise (List Action)
export const performWith = performer => (effect) => {
    const perform = performWith(performer);
    const {type, data} = effect;
    const effectPerformer = performer[type];
    return Promise.resolve().then(() => {
        if(!effectPerformer) {
            const name = typeName(type);
            throw new Error(`No performer for type ${name}, ${String(effect)}`);
        } else {
            return Promise.resolve(effectPerformer(effect, perform))
            .then(actions => {
                if(!Array.isArray(actions)) {
                    return [actions];
                } else {
                    return actions;
                }
            });
        };
    });
};

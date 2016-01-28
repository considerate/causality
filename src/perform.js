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

const defined = (x) => x !== undefined && x !== null;

export const basePerformer = () => {
    const {call, none, then, all} = effectTypes;
    const performer = {
        [none]: (effect, perform) => {
            return [];
        },
        [then]: (effect, perform) => {
            const {data} = effect;
            const {effect: first, callback, testing} = data;
            return perform(first).then(actions => { // List Action
                return Promise.all(
                    actions.filter(defined).map(action => {
                        const effect = callback(action);
                        return perform(effect); // Promise (List Action)
                    }) // List (Promise (List Action))
                ) // Promise (List (List Action))
                .then(flatten); //Promise (List Action)
            });
        },
        [all]: (effect, perform) => {
            const {data} = effect;
            const {effects}  = data;
            const effs = effects.filter(eff => defined(eff) && eff.type !== effectTypes.none); // List (Effect Action)
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
                    if(action) {
                        return [action];
                    } else {
                        return [];
                    }
                } else {
                    const actions = action; // Multiple actions returned
                    return actions.filter(defined);
                }
            })
            .catch(error => {
                console.error('Error in effect', String(effect), 'fn is undefined');
            })
        },
    };
    return performer;
};

// The test performer applies effects using the callbacks in the test effect
// to both the test effect and the production effect and asserts that the types are equal for all.
export const testPerformer = (otherEffect, assert) => {
    const {call, none, then, all} = effectTypes;
    return {
        [none]: (effect) => {
            assert.equal(otherEffect.type, none);
            return [];
        },
        [then]: (effect) => {
            assert.equal(otherEffect.type, then);
            const {effect: otherFirst} = otherEffect.data;
            const perform = performWith(testPerformer(otherFirst, assert));
            const {data} = effect;
            const {effect: first, testing} = data;
            const callback = otherEffect.data.callback;
            return Promise.all([perform(first), perform(otherFirst)])
            .then(([actions, otherActions]) => {
                return Promise.all(actions.map((action,i) => {
                    const otherAction = otherActions[i];
                    const otherEffect = callback(otherAction);
                    const effect = callback(action);
                    const perform = performWith(testPerformer(otherEffect, assert));
                    return perform(effect);
                }))
                .then(flatten);
            });
        },
        [all]: (effect) => {
            assert.equal(otherEffect.type, all);
            const {data} = effect;
            const {effects}  = data;
            const otherEffects = otherEffect.data.effects;
            return Promise.all(effects.filter(defined).map((effect,i) => {
                const other = otherEffects.filter(defined)[i];
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
    if(!effectPerformer) {
        const name = typeName(type);
        return Promise.reject(new Error(`No performer for type ${name}, ${String(effect)}, ${JSON.stringify(performer)}`));
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
};

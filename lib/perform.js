import {effectTypes} from './Effect.js';
import {typeName} from './Types.js';

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

export const perform = (effect) => {
    return performWith({});
};

// perform : Effect Action -> Promise (List Action)
export const performWith = performer => (effect) => {
    const perform = performWith(performer);
    const {type, data} = effect;
    return new Promise((resolve, reject) => {
        if(type === effectTypes.none) {
            resolve([]); // : Promise (List Action)
        }
        else if (type === effectTypes.call) {
            const {fn, args} = data;
            const promise = Promise.resolve(fn.apply(fn,args))
            .then(action => {
                return [action];
            });
            resolve(promise); // : Promise (List Action)
        }
        else if (type === effectTypes.then) {
            const {effect: first, callback, testing} = data;
            resolve(perform(first).then(actions => { // List Action
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
            }));
        }
        else if (type === effectTypes.all) {
            const {effects}  = data;
            const effs = effects.filter(eff => eff.type !== effectTypes.none); // List (Effect Action)
            if(effs.length === 0) {
                resolve([]); // : Promise (List Action)
            } else {
                resolve(
                    Promise.all(effs.map(perform)) // (Promise (List (List Action)))
                    .then(flatten) // Promise (List Action)
                );
            }
        } else {
            const effectPerformer = performer.matcher(effect);
            if(!effectPerformer) {
                const name = typeName(type);
                reject(new Error(`No performer for type ${name}, ${String(effect)}`));
            } else {
                const promise = Promise.resolve(effectPerformer(effect))
                .then(actions => {
                    if(!Array.isArray(actions)) {
                        return [actions];
                    } else {
                        return actions;
                    }
                });
                resolve(promise);
            }
        }
    }).then(actions => {
        return actions;
    });
};

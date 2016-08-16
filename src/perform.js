import {NONE, PURE, APPLY, ALL} from './CauseTypes.js';

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

export const basePerformer = (cause) => ({
    [PURE]: (data, perform) => {
        return Promise.resolve([data]);
    },
    [NONE]: (data, perform) => {
        return Promise.resolve([]);
    },
    [APPLY]: (data, perform) => {
        const {f, x} = data;
        //apply cause in Promise monad by lifiting the result of f(x).
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
        const {causes}  = data;
        const effs = causes.filter(eff => defined(eff) && eff.type !== NONE); // List (cause Action)
        if(effs.length === 0) {
            return Promise.resolve([]); // : Promise (List Action)
        } else {
            return Promise.all(effs.map(perform)) // (Promise (List (List Action)))
                .then(flatten); // Promise (List Action)
        }
    },
});

const customPerformer = (cause) => ({
    [cause.type]: cause.performer,
});

export const performer = (...extraPerformers) =>
    performWith(basePerformer, ...extraPerformers, customPerformer);

const call = (x) => (f) => f(x);

// perform : cause Action -> Promise (List Action)
export const performWith = (...performers) => (cause) => {
    const {type} = cause;
    const causePerformers = performers.map(call(cause));
    const causePerformer = causePerformers.find((p) => defined(p[type]));
    if(!causePerformer) {
        return Promise.reject(new Error(`No performer for type ${type}, ${String(cause)}, ${JSON.stringify(causePerformers)}`));
    } else {
        const {data} = cause;
        const performer = causePerformer[type];
        const perform = performWith(...performers);
        const result = performer(data, perform);
        return Promise.resolve(result).then(forceArray);
    };
};

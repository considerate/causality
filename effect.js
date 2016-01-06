import Observable from 'zen-observable';

const DEBUG = false;
const noop = () => {};
// const debug = DEBUG ? console.log.bind(console) : noop;
const debug = noop;

const SideEffect = Symbol('SideEffect');
const callbacks = Symbol('callbacks');

const prototype = {
    then(success,error) {
        return fn(this.data);
    },
};

export const Action = (type, data) => {
    return {type, data};
};
const wrap = (type,data) => action => Action(type, Object.assign(data || {}, {action}));
const unwrap = ({data:{action}}) => action;
Action.wrap = wrap;
Action.unwrap = unwrap;

export const Types = (...list) => {
    return list.reduce((obj, type) => {
        obj[type] = type; //Symbol(type);
        return obj;
    },{});
};

const effectTypes = Types('none', 'call', 'then', 'all');

const call = (fn, ...args) => {
    const type = effectTypes.call;
    const data = {
        fn,
        args,
    };
    return Effect(type, data);
};
const EffectProto = {
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
            return this;
        }
        return this.then((a) => {
            return call(fn, a);
        });
    }
};
export const Effect = (type, data) => (Object.assign({
    [SideEffect]: true,
    type,
    data,
}, EffectProto));
Effect.call = call;
export const none = Effect(effectTypes.none);
const seq = (effects) => {
    const es = effects.map(x => x);
    const e = es.shift(); //take out the first element
    if(es.length === 0) {
        return none;
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
    return Effect(
        effectTypes.all,
        {
            effects,
        }
    )
};
Effect.all = all;


const ResultSymbol = Symbol('result');

export const Result = (state, effect=none) => {
    return {state, effect, [ResultSymbol]: true};
};

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
    const {type, data} = effect;
    return new Promise((resolve, reject) => {
        if(type === effectTypes.none) {
            resolve([]);
        }
        else if (type === effectTypes.call) {
            const {fn, args} = data;
            debug(fn.toString());
            const promise = Promise.resolve(fn.apply(fn,args))
            .then(action => {
                return [action];
            });
            resolve(promise);
        }
        else if (type === effectTypes.then) {
            const {effect: first, callback, testing} = data;
            resolve(perform(first).then(actions => {
                const effects = actions.map(action => callback(action));
                const promises = effects.map(perform);
                return Promise.all(promises).then(flatten);
            }));
        }
        else if (type === effectTypes.all) {
            const {effects}  = data;
            resolve(
                Promise.all(effects.map(perform))
                .then(flatten)
                .then(actions => [actions])
            );
        }
    }).then(actions => {
        debug(type, actions);
        return actions;
    });
};


const app = (options) => {
    const defaults = {
        view: noop
    };
    const {init, update, view} = Object.assign(defaults, options);
    let next;
    const actions = new Observable(observer => {
        next = observer.next.bind(observer);
    });
    let state = init();
    view(state);
    actions.forEach(action => {
        const {type} = action;
        // console.log({action});
        const result = update(state, action);
        if(!result[ResultSymbol]) {
            throw new Error(`Unhandled action type ${type} for action ${JSON.stringify(action)}`);
        }
        const {state: nextState, effect} = result;
        state = nextState;
        if(effect.type !== effectTypes.none) {
            debug(JSON.stringify(effect, null, 2));
            perform(effect)
            .then(actions => {
                actions.forEach(next);
            })
            .catch(error => {
                console.error(error.stack);
            })
        }
        debug({state});
        view(state);
    })
    .catch(error => {
        console.error(error);
        console.error(error.stack);
    });
    return {
        next
    };
}
Effect.app = app;


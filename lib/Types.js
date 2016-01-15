export const typeName = type => typeof type === 'symbol' ? Symbol.keyFor(type) : String(type);

export const Types = (...list) => {
    return list.reduce((obj, type) => {
        obj[type] = Symbol.for(type);
        return obj;
    },{});
};

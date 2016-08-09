import {APPLY, NONE, ALL} from './EffectTypes.js';

export const effectString = (effect) => {
    const {type, data} = effect;
    const name = type;
    if(type === NONE) {
        return `[Effect ${name}]`;
    } else if(type === APPLY) {
        const {f, x} = data;
        return `${name}(${f}, ${x})`;
    } else if (type === ALL) {
        const {effects} = data;
        const nested = effects.map(String).join(', ');
        return `${name}([${nested}])`;
    } else {
        const value = (data && data.name) ? data.name : String(data);
        return `${name}(${value})`;
    }
}

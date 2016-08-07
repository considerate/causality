import {APPLY, NONE, ALL} from './EffectTypes.js';

export const effectJSON = (effect, space, indent) => {
    const {type, data} = effect;
    const name = type;
    if(type === NONE) {
        return `[Effect ${name}]`;
    } else if(type === APPLY) {
        const {fn, x} = data;
        const fnName = fn.name || 'fn';
        return `${name}(
${space}${fnName}
${x}
${indent})`;
    } else if (type === ALL) {
        const {effects} = data;
        const nested = effects.map(effect => {
            return space+effect.stringify('  '+space, space);
        }).join(',\n');
        return `${name}([
${nested}
${indent}])`;
    } else {
        return `${name}(${JSON.stringify(data)})`;
    }
}

import {typeName} from './Types.js';
const ActionProto = {
    toString() {
        const {type,data} = this;
        const name = typeName(type);
        if(data) {
            const {action} = data;
            if(action) {
                return 'Action('+name+', '+String(data.action)+')';
            } else {
                return 'Action('+name+', '+String(data)+')';
            }
        } else {
            return 'Action('+name+')';
        }
    }
};
export const Action = (type, data) => {
    const action = Object.create(ActionProto);
    return Object.assign(action,{type, data});
};
const wrap = (type,data) => action => Action(type, Object.assign(data || {}, {action}));
const unwrap = ({data:{action}}) => action;
Action.wrap = wrap;
Action.unwrap = unwrap;

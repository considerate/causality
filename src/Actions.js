import {actionString} from './pretty.js';

const ActionProto = {
    toString() {
        return actionString(this);
    }
};

const Action = (type, data) => {
    const action = Object.create(ActionProto);
    action.type = type;
    action.data = data;
    return action;
};

export default Action;

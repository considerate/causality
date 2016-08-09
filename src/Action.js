const ActionProto = {
    toString() {
        const {type: name, data} = this;
        if(data) {
            const {action} = data;
            if(action) {
                return 'Action('+name+', '+String(data.action)+')';
            } else {
                let dataString = String(data);
                if(dataString === '[object Object]') {
                    dataString = JSON.stringify(data);
                }
                return 'Action('+name+', '+dataString+')';
            }
        } else {
            return 'Action('+name+')';
        }
    }
};
export const Action = (type, data) => {
    const action = Object.create(ActionProto);
    action.type = type;
    action.data = data;
    return action;
};

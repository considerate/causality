'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Action = undefined;

var _Types = require('./Types.js');

var ActionProto = {
    toString: function toString() {
        var type = this.type;
        var data = this.data;

        var name = (0, _Types.typeName)(type);
        if (data) {
            var action = data.action;

            if (action) {
                return 'Action(' + name + ', ' + String(data.action) + ')';
            } else {
                var dataString = String(data);
                if (dataString === '[object Object]') {
                    dataString = JSON.stringify(data);
                }
                return 'Action(' + name + ', ' + dataString + ')';
            }
        } else {
            return 'Action(' + name + ')';
        }
    }
};
var Action = exports.Action = function Action(type, data) {
    var action = Object.create(ActionProto);
    return Object.assign(action, { type: type, data: data });
};
var to = function to(next, type, data) {
    return function (action) {
        return next(Action(type, Object.assign(data || {}, { action: action })));
    };
};
var wrap = function wrap(type, data) {
    return function (action) {
        return Action(type, Object.assign(data || {}, { action: action }));
    };
};
var unwrap = function unwrap(_ref) {
    var action = _ref.data.action;
    return action;
};
Action.to = to;
Action.wrap = wrap;
Action.unwrap = unwrap;
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

function _typeof(obj) { return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj; }

var typeName = exports.typeName = function typeName(type) {
    return (typeof type === 'undefined' ? 'undefined' : _typeof(type)) === 'symbol' ? Symbol.keyFor(type) : String(type);
};

var Types = exports.Types = function Types() {
    for (var _len = arguments.length, list = Array(_len), _key = 0; _key < _len; _key++) {
        list[_key] = arguments[_key];
    }

    return list.reduce(function (obj, type) {
        obj[type] = Symbol.for(type);
        return obj;
    }, {});
};
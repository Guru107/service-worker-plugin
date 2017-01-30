'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = {
    register: function register() {
        var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

        if ('serviceWorker' in navigator) {
            return navigator.serviceWorker.register(pluginOptions.script, options);
        }
        return false;
    }
};
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _SingleEntryPlugin = require('webpack/lib/SingleEntryPlugin');

var _SingleEntryPlugin2 = _interopRequireDefault(_SingleEntryPlugin);

var _minimatch = require('minimatch');

var _minimatch2 = _interopRequireDefault(_minimatch);

var _webpack = require('webpack');

var _webpack2 = _interopRequireDefault(_webpack);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var COMPILER_NAME = 'service-worker-child-compiler';

function validatePaths(assets, options) {
    var depth = options.filename.replace(/^\//, '').split('/').length;
    var basePath = Array(depth).join('../') || './';

    return assets.filter(function (asset) {
        return !!asset;
    }).map(function (key) {
        // if absolute url, use it as is
        if (/^(?:\w+:)\/\//.test(key)) {
            return key;
        }

        key = key.replace(/^\//, '');

        if (options.publicPath !== '') {
            return options.publicPath + key;
        }

        return basePath + key;
    });
}

var ServiceWorkerPlugin = function () {
    function ServiceWorkerPlugin(options) {
        _classCallCheck(this, ServiceWorkerPlugin);

        this.warnings = [];
        this.options = Object.assign({
            publicPath: '',
            excludes: ['**/.*', '**/*.map'],
            entry: null,
            filename: 'sw.js'
        }, options);

        this.options.filename = this.options.filename.replace(/^\//, '');
    }

    _createClass(ServiceWorkerPlugin, [{
        key: 'apply',
        value: function apply(compiler) {
            var _this = this;

            var runtimePath = _path2.default.resolve(__dirname, 'runtime.js');

            compiler.plugin('normal-module-factory', function (nmf) {

                nmf.plugin('after-resolve', function (result, callback) {

                    if (result.resource === runtimePath) {
                        var data = {
                            script: '' + _this.options.publicPath + _this.options.filename
                        };

                        result.loaders.push(_path2.default.join(__dirname, 'loader.js') + '?' + JSON.stringify(data));
                    }

                    callback(null, result);
                });
            });

            compiler.plugin('make', function (compilation, callback) {
                if (_this.warnings.length) {
                    [].push.apply(compilation, _this.warnings);
                }

                _this.handleMake(compilation, compiler).then(function () {
                    callback();
                }, function () {

                    callback(new Error('Something went wrong in make'));
                });
            });

            compiler.plugin('emit', function (compilation, callback) {
                _this.handleEmit(compilation, compiler, callback);
            });
        }
    }, {
        key: 'handleMake',
        value: function handleMake(compilation, compiler) {

            var childCompiler = compilation.createChildCompiler(COMPILER_NAME, {
                filename: this.options.filename
            });
            childCompiler.context = compiler.context;
            childCompiler.apply(new _SingleEntryPlugin2.default(compiler.context, this.options.entry));

            childCompiler.plugin('compilation', function (compilation2) {
                if (compilation2.cache) {
                    if (!compilation2.cache[COMPILER_NAME]) {
                        compilation2.cache[COMPILER_NAME] = {};
                    }
                    compilation2.cache = compilation2.cache[COMPILER_NAME];
                }
            });

            return new Promise(function (resolve, reject) {
                childCompiler.runAsChild(function (err) {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve();
                });
            });
        }
    }, {
        key: 'handleEmit',
        value: function handleEmit(compilation, compiler, callback) {
            var asset = compilation.assets[this.options.filename];

            if (!asset) {
                compilation.errors.push(new Error('ServiceWorkerPlugin: entry was not found'));
                return;
            }

            delete compilation.assets[this.options.filename];

            var assets = Object.keys(compilation.assets);

            var excludes = this.options.excludes;
            if (excludes.length > 0) {
                assets = assets.filter(function (assetCurrent) {
                    return !excludes.some(function (glob) {
                        return (0, _minimatch2.default)(assetCurrent, glob);
                    });
                });
            }

            assets = validatePaths(assets, this.options);

            var minify = (compiler.options.plugins || []).some(function (plugin) {
                return plugin instanceof _webpack2.default.optimize.UglifyJsPlugin;
            });

            var generatedAssets = assets;
            var generatedAssetsInline = JSON.stringify(generatedAssets, null, minify ? 0 : 2);

            var _source = ('\n            const generatedAssets = ' + generatedAssetsInline + ';\n            ' + asset.source()).trim();

            compilation.assets[this.options.filename] = {
                source: function source() {
                    return _source;
                },
                size: function size() {
                    return Buffer.byteLength(_source, 'utf-8');
                }
            };
            callback();
        }
    }]);

    return ServiceWorkerPlugin;
}();

exports.default = ServiceWorkerPlugin;
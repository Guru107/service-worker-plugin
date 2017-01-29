var path = require('path')
var ServiceWorkerPlugin = require('../src')
var webpack = require('webpack')
module.exports = {
    context:__dirname,
    entry: './index.js',
    devServer:{
        contentBase:path.join(__dirname,'dist')
    },
    output:{
        filename:'bundle.js',
        path: path.join(__dirname,'dist'),
        publicPath:'/'
    },
    plugins:[
      new ServiceWorkerPlugin({entry:'./sw.js',publicPath:'/'})
    ]
}

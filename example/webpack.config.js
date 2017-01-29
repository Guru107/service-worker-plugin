var path = require('path')
var ServiceWorkerPlugin = require('../dist').default
var webpack = require('webpack')
console.log(ServiceWorkerPlugin)
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

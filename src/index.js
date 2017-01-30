import path from 'path'
import SingleEntryPlugin from 'webpack/lib/SingleEntryPlugin'
import minimatch from 'minimatch'
import webpack from 'webpack'
const COMPILER_NAME = 'service-worker-child-compiler'

function validatePaths(assets, options) {
  const depth = options.filename.replace(/^\//, '').split('/').length
  const basePath = Array(depth).join('../') || './'

  return assets
    .filter((asset) => !!asset)
    .map((key) => {
      // if absolute url, use it as is
      if (/^(?:\w+:)\/\//.test(key)) {
        return key
      }

      key = key.replace(/^\//, '')

      if (options.publicPath !== '') {
        return options.publicPath + key
      }

      return basePath + key
    })
}

export default class ServiceWorkerPlugin {

    constructor(options){
        this.warnings = []
        this.options = Object.assign({
            publicPath: '',
            excludes: ['**/.*','**/*.map'],
            entry: null,
            filename:'sw.js'
        },options)

        this.options.filename = this.options.filename.replace(/^\//, '');
    }

    apply(compiler){

        const runtimePath = path.resolve(__dirname,'runtime.js')

        compiler.plugin('normal-module-factory', (nmf) => {

            nmf.plugin('after-resolve', (result, callback) => {

                if(result.resource === runtimePath) {
                    const data = {
                        script: `${this.options.publicPath}${this.options.filename}`
                    }

                    result.loaders.push(
                        `${path.join(__dirname,'loader.js')}?${JSON.stringify(data)}`
                    )
                }

                callback(null,result)
            })

        })

        compiler.plugin('make',(compilation,callback) => {
           if(this.warnings.length){
               [].push.apply(compilation,this.warnings)
           }

        this.handleMake(compilation, compiler)
        .then(()=>{
                callback()
            },()=>{

                callback(new Error('Something went wrong in make'))
            })

        })

        compiler.plugin('emit',(compilation,callback) => {
            this.handleEmit(compilation,compiler,callback)
        })
    }

    handleMake(compilation, compiler) {

        const childCompiler = compilation.createChildCompiler(COMPILER_NAME,{
            filename: this.options.filename
        })
        childCompiler.context = compiler.context
        childCompiler.apply(
            new SingleEntryPlugin(compiler.context,this.options.entry)
        )

        childCompiler.plugin('compilation', (compilation2) => {

            if(compilation2.cache){
                if(!compilation2.cache[COMPILER_NAME]) {
                    compilation2.cache[COMPILER_NAME] = {}
                }
                compilation2.cache = compilation2.cache[COMPILER_NAME]

            }
        })
        const _self = this
        return new Promise( (resolve,reject) => {
            childCompiler.runAsChild((err,chunk,compilation3) => {

                delete compilation3.assets[_self.options.filename]

                if(err){
                    reject(err)
                    return
                }
                resolve()
            })
        })

    }

    handleEmit(compilation,compiler,callback){
        const asset = compilation.assets[this.options.filename]

        if(!asset){
            compilation.errors.push(new Error('ServiceWorkerPlugin: entry was not found'))
            return
        }

        delete compilation.assets[this.options.filename]

        let assets = Object.keys(compilation.assets)

        const excludes = this.options.excludes
        if(excludes.length > 0) {
            assets = assets.filter((assetCurrent) => {
                return !excludes.some((glob)=>{
                    return minimatch(assetCurrent, glob)
                })
            })
        }

        assets = validatePaths(assets,this.options)

        const minify = (compiler.options.plugins || []).some(plugin => {
            return plugin instanceof webpack.optimize.UglifyJsPlugin
        })

        const generatedAssets = assets
        const generatedAssetsInline = JSON.stringify(generatedAssets,null,minify ? 0 : 2)

        const source = `
             self.generatedAssets = ${generatedAssetsInline};
            ${asset.source()}`.trim()

        compilation.assets[this.options.filename] = {
            source : () => source,
            size: () => Buffer.byteLength(source,'utf-8')
        }
        callback()
    }
}



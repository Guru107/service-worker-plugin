import path from 'path'
import fs from 'fs'

module.exports = function defaultExport(){}

module.exports.pitch = function pitch() {

    const callback = this.async()
    const templatePath = path.join(__dirname, 'template.js')

    this.cacheable()

    this.addDependency(templatePath)

    fs.readFile(templatePath,'utf-8',(err, template) => {
        if(err){
            callback(err)
            return
        }

        const source = `
            var pluginOptions = ${this.query.slice(1)};
            ${template}
        `.trim()

        callback(null,source)
    })
}

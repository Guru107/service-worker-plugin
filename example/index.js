var SWPlugin = require('../dist/runtime.js').default
if('serviceWorker' in navigator){
    SWPlugin.register({scope:'/'})
}


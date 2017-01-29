var SWPlugin = require('../src/runtime.js')
if('serviceWorker' in navigator){
    SWPlugin.register({scope:'/'})
}


export default {
    register(options={}){
        if('serviceWorker' in navigator){
            return navigator.serviceWorker.register(pluginOptions.script,options)
        }
        return false
    }
}

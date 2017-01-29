module.exports = {
    register(options={}){
        if('serviceWorker' in navigator){
            return navigator.serviceWorker.register(serviceWorkerOption.script,options)
        }
        return false
    }
}

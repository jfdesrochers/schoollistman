const m = require('mithril')
const env = require('../env.json')
const Config = require('electron-config')

const conf = new Config()

const RemoteAccess = {
    
    netTest: function () {
        return m.request(env.FIREBASE_URL + '/nettest.json')
    },

    sendStoreData: function (data) {
        return m.request({
            url: env.FIREBASE_URL + '/stores/' + conf.get('store.district') + '/' + conf.get('store.no') + '.json',
            method: 'PATCH',
            data: data
        })
    }

}

module.exports = RemoteAccess
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
    },

    sendFeedBack: function (data) {
        return m.request({
            url: 'https://api.github.com/repos/jfdesrochers/schoollistman/issues?access_token=' + env.GITHUB_TOKEN,
            method: 'POST',
            data: {
                title: "Feedback from School List Manager",
                body: data
            }
        })
    }

}

module.exports = RemoteAccess
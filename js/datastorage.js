const storage = require('electron-json-storage')
const _ = require('lodash')
const q = require('q')

let dataCache = {}

const DataStorage = {

    loadDBs: function(dbList) {
        return q.nfcall(storage.getMany, dbList).then((res) => dataCache = res).catch((err) => console.error('[StorageDB]', err))
    },

    update: function(whichDB, keyName, newData) {
        dataCache[whichDB] = _.unionBy(newData, dataCache[whichDB], (o) => o[keyName])
        dataCache[whichDB] = _.sortBy(dataCache[whichDB], keyName)
        return q.nfcall(storage.set, whichDB, dataCache[whichDB]).catch((err) => console.error('[StorageDB]', err))
    },

    getAllData: function(whichDB) {
        return dataCache[whichDB]
    }

}

module.exports = DataStorage
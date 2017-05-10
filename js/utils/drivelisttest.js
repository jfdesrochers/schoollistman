const drivelist = require('drivelist')
const q = require('q')
const glob = require('glob')
const path = require('path')

q.nfcall(drivelist.list).then((drives) => {
    drives.forEach(function(el) {
        if (!el.system) {
            q.nfcall(glob,  '/**/*.mp3', {root: el.mountpoints[0].path}).then((files) => {
                console.log(files)
            })
        }
    }, this)
})

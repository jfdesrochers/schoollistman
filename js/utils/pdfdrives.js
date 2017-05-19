const drivelist = require('drivelist')
const q = require('q')
const glob = require('glob')
const path = require('path')
const fs = require('fs-extra')
const md5File = require('md5-file/promise')
const each = require('async-each')

const getPDFDrives = function () {
    return new Promise((resolve, reject) => {
        return q.nfcall(drivelist.list).then((drives) => {
            let drivelst = []
            drives.forEach(function(el) {
                if (!el.system) {
                    drivelst.push(q.nfcall(glob,  '/**/*.pdf', {root: el.mountpoints[0].path, strict: false}).then((files) => {
                        if (files) {
                            return {
                                driveName: el.description,
                                drivePath: el.mountpoints[0].path,
                                pdfs: files.map((o) => {
                                    return [o, path.basename(path.dirname(o)), path.basename(o, '.pdf')]
                                })
                            }
                        }
                    }))
                }
            }, this)
            return Promise.all(drivelst)
        }).then((drives) => resolve(drives)).catch((err) => reject(err))
    })
}

module.exports.getPDFDrives = getPDFDrives

const copyPDFData = function (files, datadir) {

    const pdfIterator = function (file, cb) {
        md5File(file[0]).then((hash) => {
            fs.copy(file[0], path.join(datadir, hash + '.pdf'), {overwrite: false}).then(() => {
                cb(null, [hash, file[1], file[2]])
            }).catch((e) => {
                console.log('[Copy File]', e)
                cb(e)
            })
        }).catch((e) => {
            console.log('[MD5 Hash]', e)
            cb(e)
        })
    }

    return fs.ensureDir(datadir).then(() => q.nfcall(each, files, pdfIterator)).catch((e) => {
        console.error('[Copy PDF Data]', e)
        return e
    })
}

module.exports.copyPDFData = copyPDFData
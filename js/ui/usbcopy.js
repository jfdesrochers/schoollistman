const m = require('mithril')
const {getPDFDrives, copyPDFData} = require('../utils/pdfdrives.js')
const t = require('jfdcomponents').Translator
const {remote} = require('electron');
const path = require('path')
const _ = require('lodash')

const genUUID = function () {
    'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
}

const usbUI = {}

usbUI.oninit = function () {
    let self = this
    self.status = 'loading'
    self.drivelist = []
    self.loadingmessage = t('usblooking')
    self.loadUSBDrives = function () {
        self.status = 'loading'
        self.loadingmessage = t('usblooking')
        getPDFDrives().then((drives) => {
            self.drivelist = drives
            self.status = 'drivelist'
            m.redraw()
        }).catch((err) => {
            console.error('[Drive Scanner]', err)
            self.drivelist = []
            self.status = 'driveerror'
            m.redraw()
        })
    }
    self.loadFromUSB = function (files) {
        return (e) => {
            e.preventDefault()
            self.progress = 0
            self.status = 'loading'
            self.loadingmessage = t('usbcopying')
            const userDir = path.join(remote.app.getPath('userData'), 'pdfs')
            copyPDFData(files.pdfs, userDir).then((results) => {
                let resObj = []
                results.forEach((o) => {
                    let sIdx = resObj.findIndex((f) => f.name === o[1])
                    if (sIdx > -1) {
                        let cIdx = resObj[sIdx].classes.findIndex((f) => f.name === o[2])
                        if (cIdx > -1) {
                            resObj[sIdx].classes[cIdx] = {id: o[0], name: o[2]}
                        } else {
                            resObj[sIdx].classes.push({id: o[0], name: o[2]})
                        }
                    } else {
                        resObj.push({name: o[1], id: genUUID(), classes: [{name: o[2], id: o[0]}]})
                    }
                })
                resObj = _.sortBy(resObj, [(o) => {
                    o.classes = _.sortBy(o.classes, ['name'])
                    return o.name
                }])
                console.log(resObj)
            }).catch(() => {
                self.status = 'driveerror'
                m.redraw()
            })
        }
    }
}

usbUI.oncreate = function () {
    let self = this
    self.loadUSBDrives()
}

usbUI.view = function () {
    let self = this
    return [
        m('p', t('usbbody')),
        m('div.mt30'),
        self.status == 'loading' ? [
            m('p.bold', self.loadingmessage),
            m('div.progress', m('div.progress-bar.progress-bar-striped.progress-bar-success.active', {style: 'width: 100%;'}))
        ] : self.status == 'drivelist' ? [
            m('div.list-group', [
                self.drivelist.filter((o) => o.pdfs.length > 0).map((o) => {
                    return m('a.list-group-item.usb-item[href="#"]', {onclick: self.loadFromUSB(o)}, [
                        m('img.list-icon', {src: 'img/flashdrive.png'}),
                        m('span.badge', o.pdfs.length + t('usbpdfsfound')),
                        m('h4.list-group-item-heading', t('usbdrive') + ' ' + o.drivePath),
                        m('p.list-group-item-text', o.driveName)
                    ])
                }),
                m('a.list-group-item.usb-item[href="#"]', {onclick: (e) => {
                    e.preventDefault()
                    self.loadUSBDrives()
                }}, [
                    m('span.glyphicon.glyphicon-repeat.list-icon-sm'),
                    m('h4.no-margin', t('usbreload'))
                ])
            ])
        ] : self.status == 'driveerror' ? [
            m('div.list-group', [
                m('div.alert.alert-danger', t('usberror')),
                m('a.list-group-item.usb-item[href="#"]', {onclick: (e) => {
                    e.preventDefault()
                    self.loadUSBDrives()
                }}, [
                    m('span.glyphicon.glyphicon-repeat.list-icon-sm'),
                    m('h4.no-margin', t('usbreload'))
                ])
            ])
        ] : [

        ]
    ]
}

module.exports = usbUI
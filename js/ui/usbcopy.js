const m = require('mithril')
const {getPDFDrives, copyPDFData} = require('../utils/pdfdrives.js')
const t = require('jfdcomponents').Translator
const {remote} = require('electron');
const path = require('path')

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
                console.log(results)
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
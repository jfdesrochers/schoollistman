const m = require('mithril')
const t = require('jfdcomponents').Translator
const Config = require('electron-config')
const Mousetrap = require('mousetrap')
const _ = require('lodash')
const RemoteAccess = require('../remoteaccess.js')
const DataStorage = require('../datastorage.js')
const excel = require('node-excel-export')
const {remote} = require('electron')
const fs = require('fs')

const {ValidationManager, ValidatingInput} = require('jfdcomponents')
const {tutWindow} = require('./tutorial.js')
const usbUI = require('./usbcopy.js')

const conf = new Config()

const Settings = {pages: {}}

const zfill = function (s, size) {
    while (s.length < size) s = "0" + s
    return s
}

Settings.pages.stPassCode = {
    oninit: function (vnode) {
        let self = this

        self.passcode = zfill(conf.get('store.no'), 4)
        self.curpass = ''
        self.passerror = false
        
        Mousetrap.bind(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'], (e, key) => {self.addkey(key)})
        Mousetrap.bind('backspace', () => {self.removekey()})
        
        self.addkey = function (key) {
            self.curpass = self.curpass + key
            if (self.curpass.length === 4) {
                if (self.curpass === self.passcode) {
                    self.curpass = ''
                    vnode.attrs.changePage('stMainPage')
                } else {
                    self.passerror = true
                    self.curpass = ''
                }
            } else {
                self.passerror = false
            }
            m.redraw()
        }

        self.touchAddkey = function (key) {
            return function (e) {
                e.preventDefault()
                self.addkey(key)
            }
        }
        
        self.removekey = function () {
            if (self.curpass.length > 0) {
                self.curpass = self.curpass.slice(0, self.curpass.length - 1)
                m.redraw()
            }
        }
    },

    onremove: function () {
        Mousetrap.unbind(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'])
        Mousetrap.unbind('backspace')
    },

    view: function (vnode) {
        let self = this
        return tutWindow(0, 0, t('passtitle'), [
            m('p', t('passdesc')),
            m('div.row', m('div.col-xs-12.text-center.passdisplay', [
                m('p.pass', "\u25CF".repeat(self.curpass.length)),
                self.passerror ? m('p.text-danger.passerror', t('passerror')) : ''
            ])),
            m('div.row.keypad', [
                m('div.keycol', m('button.btn.btn-block.btn-primary', {onclick: self.touchAddkey('1')}, '1')),
                m('div.keycol', m('button.btn.btn-block.btn-primary', {onclick: self.touchAddkey('2')}, '2')),
                m('div.keycol', m('button.btn.btn-block.btn-primary', {onclick: self.touchAddkey('3')}, '3'))
            ]),
            m('div.row.keypad', [
                m('div.keycol', m('button.btn.btn-block.btn-primary', {onclick: self.touchAddkey('4')}, '4')),
                m('div.keycol', m('button.btn.btn-block.btn-primary', {onclick: self.touchAddkey('5')}, '5')),
                m('div.keycol', m('button.btn.btn-block.btn-primary', {onclick: self.touchAddkey('6')}, '6'))
            ]),
            m('div.row.keypad', [
                m('div.keycol', m('button.btn.btn-block.btn-primary', {onclick: self.touchAddkey('7')}, '7')),
                m('div.keycol', m('button.btn.btn-block.btn-primary', {onclick: self.touchAddkey('8')}, '8')),
                m('div.keycol', m('button.btn.btn-block.btn-primary', {onclick: self.touchAddkey('9')}, '9'))
            ]),
            m('div.row.keypad', [
                m('div.keycol.col-xs-offset-4', m('button.btn.btn-block.btn-primary', {onclick: self.touchAddkey('0')}, '0')),
                m('div.keycol', m('button.btn.btn-block.btn-primary', {onclick: (e) => {
                    e.preventDefault()
                    self.removekey()
                }}, '\u232B'))
            ])
        ], [
            m('button.btn.btn-default.pull-left', {onclick: () => {vnode.attrs.changePage('TitlePage')}}, t('gobackbtn'))
        ])
    }
}

Settings.pages.stMainPage = {
    oninit: function (vnode) {
        let self = this

        self.sections = [
            {name: 'stLangOptions', desc: t('langoptions'), icon: '.glyphicon.glyphicon-font', color: 'col9'},
            {name: 'stStoreOptions', desc: t('storeoptions'), icon: '.glyphicon.glyphicon-shopping-cart', color: 'col2'},
            {name: 'stLoadUSB', desc: t('usbload'), icon: '.glyphicon.glyphicon-open-file', color: 'col3'},
            {name: 'stEditLists', desc: t('listedit'), icon: '.glyphicon.glyphicon-edit', color: 'col4'},
            {name: 'stGetStats', desc: t('getstats'), icon: '.glyphicon.glyphicon-list-alt', color: 'col11'},
            {name: 'stFeedback', desc: t('feedback'), icon: '.glyphicon.glyphicon-bullhorn', color: 'col5'}
        ]
    },

    view: function (vnode) {
        let self = this
        return tutWindow(0, 0, t('stmaintitle'), [
            m('p', t('stmaindesc')),
            m('div.options-grid', [
                _.chunk(self.sections, 2).map((a) => {
                    return m('div.row', [
                        a.map((o) => {
                            return m('div.col-xs-6', m('a[href="#"]', {onclick: (e) => {
                                e.preventDefault()
                                vnode.attrs.changePage(o.name)
                            }}, [
                                m('div.tile', [
                                    m('div.tile-thumb.' + o.color, m('div.tile-thumb-inner', m('div' + o.icon))),
                                    m('div.tile-title', m('h3', o.desc))
                                ])
                            ]))
                        })
                    ])
                }),
                m('div.row', m('div.col-xs-12', [
                    m('a[href="#"]', {onclick: (e) => {
                        e.preventDefault()
                        remote.app.quit()
                    }}, [
                        m('div.tile', [
                            m('div.tile-thumb.col8', {style: 'font-size: 2vw;'}, m('div.tile-thumb-inner', m('div.glyphicon.glyphicon-off'))),
                            m('div.tile-title', m('h3', t('exitapp')))
                        ])
                    ])
                ]))
            ]),
        ], [
            m('button.btn.btn-default.pull-left', {onclick: () => {vnode.attrs.changePage('TitlePage')}}, t('gobackbtn'))
        ])
    }
}

Settings.pages.stLangOptions = {
    oninit: function (vnode) {
        let self = this
        self.mainlang = conf.get('defaultlanguage')
        self.mullang = conf.get('languageselection')
        self.setDefLang = (lang) => {
            return (e) => {
                e.preventDefault()
                conf.set('defaultlanguage', lang)
                t.setLang(lang)
                self.mainlang = lang
            }
        }
        self.setMulLang = (choice) => {
            return (e) => {
                e.preventDefault()
                conf.set('languageselection', choice)
                self.mullang = choice
            }
        }
    },

    view: function (vnode) {
        let self = this
        return tutWindow(0, 0, t('langoptions'), [
            m('p', t('langdesc')),
            m('p', t('tut1body')),
            m('div.list-group.mt30', [
                m('a.list-group-item' + (self.mainlang == 'fr' ? '.active': '') + '[href="#"]', {onclick: self.setDefLang('fr')}, t('tut1choice', 'fr')),
                m('a.list-group-item' + (self.mainlang == 'en' ? '.active': '') + '[href="#"]', {onclick: self.setDefLang('en')}, t('tut1choice', 'en'))
            ]),
            m('p', t('tut2body')),
            m('div.list-group.mt30', [
                m('a.list-group-item' + (self.mullang ? '.active': '') + '[href="#"]', {onclick: self.setMulLang(true)}, t('tut2choice1')),
                m('a.list-group-item' + (!self.mullang ? '.active': '') + '[href="#"]', {onclick: self.setMulLang(false)}, t('tut2choice2'))
            ])
        ], [
            m('button.btn.btn-default.pull-left', {onclick: () => {vnode.attrs.changePage('stMainPage')}}, t('gobackbtn'))
        ])
    }
}

Settings.pages.stStoreOptions = {
    oninit: function (vnode) {
        let self = this
        self.forms = ValidationManager()
        self.saveStoreInfo = (e) => {
            e.preventDefault()
            if (self.forms.allValid()) {
                conf.set('store.no', self.forms.fields.storeno.value)
                conf.set('store.district', self.forms.fields.districtno.value)
                vnode.attrs.changePage('stMainPage')
            }
        }
    },

    view: function (vnode) {
        let self = this
        return tutWindow(0, 0, t('storeoptions'), [
            m('p', t('storedesc')),
            m('div.mt30'),
            m(ValidatingInput, {options: {
                name: 'districtno',
                type: 'text',
                label: t('tut3districtlabel'),
                defaultValue: conf.get('store.district'),
                validPattern: /^[1-9][0-9][0-9]?$/gi,
                errMessage: t('tut3districterror'),
                showValid: true,
                fields: self.forms
            }}),
            m(ValidatingInput, {options: {
                name: 'storeno',
                type: 'text',
                label: t('tut3storelabel'),
                defaultValue: conf.get('store.no'),
                validPattern: /^[1-9][0-9][0-9]?$/gi,
                errMessage: t('tut3storeerror'),
                showValid: true,
                fields: self.forms
            }})
        ], [
            m('button.btn.btn-default.pull-left', {onclick: () => {vnode.attrs.changePage('stMainPage')}}, t('gobackbtn')),
            m('button.btn.btn-primary.pull-right', {onclick: self.saveStoreInfo}, t('savebtn'))
        ])
    }
}

Settings.pages.stLoadUSB = {
    oninit: function (vnode) {
        let self = this
        
    },

    view: function (vnode) {
        let self = this
        return tutWindow(0, 0, t('usbtitle'), [
            m(usbUI, {onDone: (data) => {
                RemoteAccess.sendStoreData({schools: data}).catch((err) => {
                    console.error('[Request]', err)
                })
                m.redraw()
            }})
        ], [
            m('button.btn.btn-default.pull-left', {onclick: () => {vnode.attrs.changePage('stMainPage')}}, t('gobackbtn'))
        ])
    }
}

Settings.pages.stEditLists = {
    oninit: function (vnode) {
        let self = this
        self.alllists = _.cloneDeep(DataStorage.getAllData('schools'))
        self.editing = {id: '', curName: '', newName: ''}
        self.dirty = false

        self.toggleTree = function (e) {
            if (e.target.tagName === 'SPAN') {
                e.target.parentElement.classList.toggle('collapsed')
            }
        }
        self.doEdit = function (id, name, active) {
            return (e) => {
                e.preventDefault()
                if (active) {
                    self.editing.id = id
                    self.editing.curName = name
                    self.editing.newName = name
                } else {
                    if (self.editing.curName !== self.editing.newName) {
                        if (self.editing.id === self.editing.curName) {
                            let idx = self.alllists.findIndex((o) => o.name === self.editing.id)
                            if (idx > -1) {
                                self.dirty = true
                                self.alllists[idx].name = self.editing.newName
                            }
                        } else {
                            self.alllists.forEach((e, si) => {
                                let ci = e.classes.findIndex((o) => o.id === self.editing.id)
                                if (ci > -1) {
                                    self.dirty = true
                                    self.alllists[si].classes[ci].name = self.editing.newName
                                }
                            })
                        }
                    }
                    self.editing = {id: '', curName: ''}
                }
            }
        }
        self.doRemove = function (id, name) {
            return (e) => {
                e.preventDefault()
                if (id === name) {
                    let idx = self.alllists.findIndex((o) => o.name === id)
                    if (idx > -1) {
                        self.dirty = true
                        self.alllists.splice(idx, 1)
                    }
                } else {
                    let si = self.alllists.findIndex((o) => o.name === name)
                    if (si > -1) {
                        let ci = self.alllists[si].classes.findIndex((o) => o.id === id)
                        if (ci > -1) {
                            self.dirty = true
                            self.alllists[si].classes.splice(ci, 1)
                            return true
                        }
                    }
                }
            }
        }
        self.saveDB = function (e) {
            e.preventDefault()
            DataStorage.replace('schools', 'name', self.alllists).then(() => {
                RemoteAccess.sendStoreData({schools: self.alllists}).catch((err) => {
                    console.error('[Request]', err)
                })
                vnode.attrs.changePage('stMainPage')
                m.redraw()
            })
        }
    },

    view: function (vnode) {
        let self = this
        return tutWindow(0, 0, t('listedit'), [
            m('p', t('listeditbody')),
            m('div.alert.alert-danger', m.trust(t('listeditwarning'))),
            m('div.mt30'),
            m('div.tree', m('ul', m('li.treeparent', [
                m('span', {onclick: self.toggleTree}, [m('i.treeicon'), t('schoollists')]),
                m('ul', self.alllists.map((o) => {
                    return m('li.treeparent.collapsed', [
                        m('span', self.editing.id === o.name ? '' : {onclick: self.toggleTree}, [
                            m('i.treeicon'),
                            self.editing.id === o.name ? m('input#itemedit', {oncreate: (vdom) => {vdom.dom.select()}, onchange: m.withAttr('value', (v) => {self.editing.newName = v}), value: self.editing.newName}) : o.name,
                            self.editing.id === o.name ? m('button.btn.btn-xs.btn-success', {onclick: self.doEdit(o.name, o.name, false)}, m('i.glyphicon.glyphicon-ok')) : self.editing.id === '' ? m('button.btn.btn-xs.btn-warning', {onclick: self.doEdit(o.name, o.name, true)}, m('i.glyphicon.glyphicon-pencil')) : '',
                            self.editing.id === o.name ? '' : self.editing.id === '' ? m('button.btn.btn-xs.btn-danger', {onclick: self.doRemove(o.name, o.name)}, m('i.glyphicon.glyphicon-remove')) : ''
                            ]),
                        m('ul', o.classes.map((c) => {
                            return m('li', [
                                m('span', [
                                    self.editing.id === c.id ? m('input#itemedit', {oncreate: (vdom) => {vdom.dom.select()}, onchange: m.withAttr('value', (v) => {self.editing.newName = v}), value: self.editing.newName}) : c.name,
                                    self.editing.id === c.id ? m('button.btn.btn-xs.btn-success', {onclick: self.doEdit(c.id, c.name, false)}, m('i.glyphicon.glyphicon-ok')) : self.editing.id === '' ? m('button.btn.btn-xs.btn-warning', {onclick: self.doEdit(c.id, c.name, true)}, m('i.glyphicon.glyphicon-pencil')) : '',
                                    self.editing.id === c.id ? '' : self.editing.id === '' ? m('button.btn.btn-xs.btn-danger', {onclick: self.doRemove(c.id, o.name)}, m('i.glyphicon.glyphicon-remove')) : ''
                                ])
                            ])
                        }))
                    ])
                }))
            ])))
        ], [
            m('button.btn.btn-default.pull-left', {onclick: () => {vnode.attrs.changePage('stMainPage')}}, t('gobackbtn')),
            self.dirty? m('button.btn.btn-primary.pull-right', {onclick: self.saveDB}, t('savebtn')) : ''
        ])
    }
}

Settings.pages.stGetStats = {
    oninit: function (vnode) {
        let self = this
        self.showclasses = false
        let allstats = DataStorage.getAllData('stats')
        self.alllists = _.cloneDeep(DataStorage.getAllData('schools'))
        self.alllists.forEach((s) => {
            s.totals = 0
            s.classes.forEach((c) => {
                if (c.id in allstats) {
                    c.totals = allstats[c.id]
                    s.totals = s.totals + c.totals
                } else {
                    c.totals = 0
                }
            })
            s.classes = _.orderBy(s.classes, 'totals', 'desc')
        })
        self.alllists = _.orderBy(self.alllists, 'totals', 'desc')

        self.exportexcel = function (e) {
            e.preventDefault()
            let xldata = []
            self.alllists.forEach((s) => {
                xldata.push({sname: s.name, cname: '', totals: s.totals})
                s.classes.forEach((c) => {
                    xldata.push({sname: '', cname: c.name, totals: s.totals})
                })
            })
            const xlspec = {
                sname: {
                    displayName: t('statsschoolname'),
                    width: '30'
                },
                cname: {
                    displayName: t('statsclassname'),
                    width: '40'
                },
                totals: {
                    displayName: t('statstotals'),
                    width: '10'
                },
            }
            let saveloc = remote.dialog.showSaveDialog(remote.getCurrentWindow(), {
                title: t('downstats'),
                buttonLabel: t('savebtn'),
                filters: [
                    {name: 'Excel Document', extensions: ['xlsx']}
                ]
            })
            if (saveloc) {
                try {
                    const report = excel.buildExport([
                        {
                            name: 'Stats',
                            specification: xlspec,
                            data: xldata,
                            heading: [[t('statsschoolname'), t('statsclassname'), t('statstotals')]]
                        }
                    ])
                    fs.writeFileSync(saveloc, report)
                } catch (err) {
                    console.error('[Write XLSX] ', err)
                }
            }
        }
    },

    view: function (vnode) {
        let self = this
        return tutWindow(0, 0, t('getstats'), [
            m('p', t('statsdesc')),
            m("div.checkbox", m("label", [m("input", {type: "checkbox", onclick: m.withAttr('checked', (v) => self.showclasses = v)}), t('showclasses')])),
            m('table.table.table-striped', [
                m('thead', m('tr', [
                    m('th', t('statsschoolname')),
                    self.showclasses ? m('th', t('statsclassname')) : '',
                    m('th', t('statstotals'))
                ])),
                m('tbody', [
                    self.alllists.map((o) => {
                        return [
                            m('tr', [
                                m('td', o.name),
                                self.showclasses ? m('td', '') : '',
                                m('td', o.totals)
                            ]),
                            self.showclasses ? o.classes.map((c) => {
                                return [
                                    m('tr', [
                                        m('td', ''),
                                        m('td', c.name),
                                        m('td', c.totals)
                                    ])
                                ]
                            }) : ''
                        ]
                    })
                ])
            ])
        ], [
            m('button.btn.btn-default.pull-left', {onclick: () => {vnode.attrs.changePage('stMainPage')}}, t('gobackbtn')),
            m('button.btn.btn-success.pull-right', {onclick: self.exportexcel}, t('downstats'))
        ])
    }
}

Settings.pages.stFeedback = {
    oninit: function (vnode) {
        let self = this
        self.status = 'form'
        self.githubissue = ''
        self.forms = ValidationManager()
        self.sendFeedback = (e) => {
            e.preventDefault()
            if (self.forms.allValid()) {
                let msg = `**Name**: ${self.forms.fields.uname.value}\n\n**Store**: ${self.forms.fields.storeno.value}\n\n**Email**: ${self.forms.fields.email.value}\n\n**Message**: ${self.forms.fields.message.value}`
                self.status = 'sending'
                RemoteAccess.sendFeedBack(msg).then((res) => {
                    self.githubissue = res.html_url
                    self.status = 'sent'
                    m.redraw()
                }).catch((err) => {
                    console.error('[Send Feedback]', err)
                    self.status = 'error'
                    m.redraw()
                })
            }
        }
    },

    view: function (vnode) {
        let self = this
        return tutWindow(0, 0, t('feedback'), self.status === 'form' ? [
            m('p', t('feedbackdesc')),
            m('div.mt30'),
            m(ValidatingInput, {options: {
                name: 'uname',
                type: 'text',
                label: t('fdnamedesc'),
                defaultValue: '',
                validPattern: /^.+$/gi,
                errMessage: t('fdnotemptyerror'),
                showValid: true,
                fields: self.forms
            }}),
            m(ValidatingInput, {options: {
                name: 'storeno',
                type: 'text',
                label: t('fdstoredesc'),
                defaultValue: conf.get('store.no'),
                validPattern: /^[1-9][0-9][0-9]?$/gi,
                errMessage: t('fdstoreerror'),
                showValid: true,
                fields: self.forms
            }}),
            m(ValidatingInput, {options: {
                name: 'email',
                type: 'text',
                label: t('fdemaildesc'),
                defaultValue: '',
                validPattern: /^[a-zA-Z0-9]+[_a-zA-Z0-9\.-]*[a-zA-Z0-9]+@[a-z0-9-]+(\.[a-z0-9-]+)*(\.[a-z]{2,4})$/gi,
                errMessage: t('fdemailerror'),
                showValid: true,
                fields: self.forms
            }}),
            m(ValidatingInput, {options: {
                name: 'message',
                type: 'text',
                label: t('fdmsgdesc'),
                defaultValue: '',
                validPattern: /^.+$/gi,
                errMessage: t('fdnotemptyerror'),
                showValid: true,
                fields: self.forms
            }})
        ] : self.status === 'sending' ? [
            m('img.center-block.tut-image', {src: 'img/neticonsync.png'}),
            m('h4.text-center', t('fdsending'))
        ] : self.status === 'sent' ? [
            m('img.center-block.tut-image', {src: 'img/neticongood.png'}),
            m('h4', t('fdsent')),
            m('p', self.githubissue)
        ] : self.status === 'error' ? [
            m('img.center-block.tut-image', {src: 'img/neticonerror.png'}),
            m('p', t('fderror')),
            m('div.mt30')
        ] : '', [
            m('button.btn.btn-default.pull-left', {onclick: () => {vnode.attrs.changePage('stMainPage')}}, t('gobackbtn')),
            self.status === 'form' ? m('button.btn.btn-primary.pull-right', {onclick: self.sendFeedback}, t('fdsendbutton')) : ''
        ])
    }
}

module.exports = Settings
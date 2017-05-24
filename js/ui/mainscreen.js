const m = require('mithril')
const {Animator} = require('jfdcomponents')
const t = require('jfdcomponents').Translator
const Config = require('electron-config')
const _ = require('lodash')
const UniqueRandom = require('../utils/uniquerandom.js')
const {remote} = require('electron')
const path = require('path')

const conf = new Config()
const anim = new Animator('mainscreen')

const DataStorage = require('../datastorage.js')

const MainScreen = {pages: {}}

MainScreen.pages.TitlePage = {
    oninit: function (vnode) {
        let self = this
        self.dualmode = conf.get('languageselection')
        self.mainlang = conf.get('defaultlanguage')
        self.seclang = self.mainlang == 'en' ? 'fr' : 'en'
        t.setLang(self.mainlang)

        self.goToSchools = function (lang) {
            return (e) => {
                e.preventDefault()
                t.setLang(lang)
                vnode.attrs.changePage('ChooseSchool')
            }
        }
    },
    view: function () {
        let self = this
        return m('div.page-container', self.dualmode ? [
            m('h1.dualtitle.white', m.trust(t('maintitle', self.mainlang))),
            m('h1.dualtitle.secondary', m.trust(t('maintitle', self.seclang))),
            m('a[href="#"]', {onclick: self.goToSchools(self.mainlang)}, m('h1.dualsubtitle.white.bordered', m.trust(t('dualsubtitle', self.mainlang)))),
            m('a[href="#"]', {onclick: self.goToSchools(self.seclang)}, m('h1.dualsubtitle.secondary.bordered', m.trust(t('dualsubtitle', self.seclang)))),
            m('img.duallogo', {src: t('stapleslogo', self.mainlang)}),
            m('img.duallogo.secondary', {src: t('stapleslogo', self.seclang)})
        ] : [
            m('h1.maintitle.white', m.trust(t('maintitle'))),
            m('a[href="#"]', {onclick: self.goToSchools(self.mainlang)}, m('h1.mainsubtitle.white.bordered', m.trust(t('mainsubtitle')))),
            m('img.mainlogo', {src: t('stapleslogo')})
        ])
    }
}

MainScreen.pages.ChooseSchool = {
    oninit: function (vnode) {
        let self = this
        self.schools = DataStorage.getAllData('schools')
        self.loadSchool = function (schoolName) {
            return function (e) {
                e.preventDefault()
                document.body.scrollTop = 0
                vnode.attrs.changePage('ChooseClass', schoolName)
            }
        }
        self.randomColor = UniqueRandom(1, 11, true)
    },
    
    view: function () {
        let self = this
        return m('div.page-container', [
            m('h1.schoolstep', t('chooseschooltitle')),
            m('h3.schoolsubstep', t('chooseschoolsubtitle')),
            m('div.bubble-list', m('div.container-fluid', [
                _.chunk(self.schools, 4).map((a) => {
                    return m('div.row', [
                        a.map((o) => {
                            return m('div.col-xs-3', m('a[href="#"]', {onclick: self.loadSchool(o.name)}, [
                                m('div.tile', [
                                    m('div.tile-thumb', {oncreate: (vdom) => vdom.dom.classList.add('col'+ self.randomColor())}, m('div.tile-thumb-inner', m('div.glyphicon.glyphicon-education'))),
                                    m('div.tile-title', m('h3', o.name))
                                ])
                            ]))
                        })
                    ])
                })
            ]))
        ])
    }
}

MainScreen.pages.ChooseClass = {
    oninit: function (vnode) {
        let self = this
        self.schoolName = vnode.attrs.pageParam
        self.classes = DataStorage.getSchoolClasses(self.schoolName)
        self.loadClass = function (classID, className) {
            return function (e) {
                e.preventDefault()
                document.body.scrollTop = 0
                vnode.attrs.changePage('PrintClass', {id: classID, schoolName: self.schoolName, className: className})
            }
        }
        self.randomColor = UniqueRandom(1, 11, true)
    },
    
    view: function (vnode) {
        let self = this
        return m('div.page-container', [
            m('h1.schoolstep', t('chooseclasstitle')),
            m('h3.schoolsubstep', t('chooseclasssubtitle')),
            m('div.bubble-list', m('div.container-fluid', [
                m('a.bubble-list-banner[href="#"]', {onclick: (e) => {
                    e.preventDefault()
                    document.body.scrollTop = 0
                    vnode.attrs.changePage('ChooseSchool')
                }}, [
                    m('span.glyphicon.glyphicon-chevron-left.pull-left.pad-left'),
                    m('h4.bubble-list-banner-heading', self.schoolName),
                    m('p.bubble-list-banner-text', t('gobackschool'))
                ]),
                _.chunk(self.classes, 6).map((a) => {
                    return m('div.row', [
                        a.map((o) => {
                            let initial = o.name.match(/(\d+)\D*(\d+)?.*/)
                            if (initial && initial[2]) {
                                initial = _.tail(initial).join('-')
                            } else if (initial) {
                                initial = initial[1]
                            } else {
                                initial = o.name[0]
                            }
                            let size = initial.length <= 3 ? '.x3' : initial.length <= 5 ? '.x2' : ''
                            return m('div.col-xs-2.text-center', m('a[href="#"]', {onclick: self.loadClass(o.id, o.name)}, [
                                m('div.bubble-item', {oncreate: (vdom) => vdom.dom.classList.add('col'+ self.randomColor())}, [
                                    m('div.bubble-inner' + size, initial),
                                ]),
                                m('h3.bubble-title', o.name)
                            ]))
                        })
                    ])
                })
            ]))
        ])
    }
}

MainScreen.pages.PrintClass = {
    oninit: function (vnode) {
        let self = this
        self.classID = vnode.attrs.pageParam
        self.loadClass = function (classID) {
            return function (e) {
                e.preventDefault()
                vnode.attrs.changePage('ChooseClass', classID)
            }
        }
        self.getPDFPath = function (id) {
            return path.join(remote.app.getPath('userData'), 'pdfs', id + '.pdf')
        }
    },
    
    view: function (vnode) {
        let self = this
        return m('div.page-container.d-flex', [
            m('div.bubble-list.side-panel', [
                m('h1.printstep', t('printclasstitle')),
                m('h3.printsubstep', t('printclasssubtitle')),
                m('button.btn.btn-primary.btn-block.btn-list', t('printlistbtn')),
                m('button.btn.btn-default.btn-block.btn-list', {onclick: (e) => {
                    e.preventDefault()
                    document.querySelector('iframe').src = ''
                    vnode.attrs.changePage('ChooseClass', self.classID.schoolName)
                }}, t('laststepbtn')),
            ]),
            m('iframe.d-grow', {src: 'vendor/pdf/web/viewer.html?file=' + self.getPDFPath(self.classID.id)})
        ])
    }
}

MainScreen.oninit = function () {
    let self = this
    self.currentPage = 'TitlePage'
    self.pageParam = null
    self.changePage = (newPage, pageParam) => {
        self.pageParam = pageParam
        self.currentPage = newPage
    }
}

MainScreen.view = function () {
    let self = this
    return m(MainScreen.pages[self.currentPage], {oncreate: anim.create, onremove: anim.remove, key: self.currentPage, pageParam: self.pageParam, changePage: self.changePage})
}

module.exports = MainScreen
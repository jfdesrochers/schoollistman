const m = require('mithril')
const {Animator} = require('jfdcomponents')
const t = require('jfdcomponents').Translator
const Config = require('electron-config')

const conf = new Config()
const anim = new Animator('mainscreen')

const DataStorage = require('../datastorage.js')

const MainScreen = {pages: {}}

MainScreen.pages.TitlePage = {
    oninit: function () {
        let self = this
        self.dualmode = conf.get('languageselection')
        self.mainlang = conf.get('defaultlanguage')
        self.seclang = self.mainlang == 'en' ? 'fr' : 'en'
        t.setLang(self.mainlang)
    },
    view: function () {
        let self = this
        return m('div.page-container', self.dualmode ? [
            m('h1.dualtitle.white', m.trust(t('maintitle', self.mainlang))),
            m('h1.dualtitle.secondary', m.trust(t('maintitle', self.seclang))),
            m('h1.dualsubtitle.white.bordered', m.trust(t('dualsubtitle', self.mainlang))),
            m('h1.dualsubtitle.secondary.bordered', m.trust(t('dualsubtitle', self.seclang))),
            m('img.duallogo', {src: t('stapleslogo', self.mainlang)}),
            m('img.duallogo.secondary', {src: t('stapleslogo', self.seclang)})
        ] : [
            m('h1.maintitle.white', m.trust(t('maintitle'))),
            m('h1.mainsubtitle.white.bordered', m.trust(t('mainsubtitle'))),
            m('img.mainlogo', {src: t('stapleslogo')})
        ])
    }
}

MainScreen.oninit = function () {
    let self = this
    self.currentPage = 'TitlePage'
    self.changePage = (newPage) => {self.currentPage = newPage}
}

MainScreen.view = function () {
    let self = this
    return m(MainScreen.pages[self.currentPage], {oncreate: anim.create, onremove: anim.remove, key: self.currentPage, changePage: self.changePage})
}

module.exports = MainScreen
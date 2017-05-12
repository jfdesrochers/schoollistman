const m = require('mithril')
const Configstore = require('configstore')
const {Animator} = require('jfdcomponents')
const t = require('jfdcomponents').Translator

const conf = new Configstore('schoollistman')
const anim = new Animator('tutorial')

const tutSteps = {}

tutSteps.TutStep1 = {
    oninit: function (vnode) {
        let self = this
        self.setDefLang = (lang) => {
            return (e) => {
                e.preventDefault()
                conf.set('defaultlanguage', lang)
                t.setLang(lang)
                vnode.attrs.changeStep('TutStep2')
            }
        }
    },
    view: function () {
        let self = this
        return m('div.tut-container', m('div.tut-panel', m('div.tut-content', [
            m('div.tut-header', m('h3.tut-title', t('tut1title'))),
            m('div.tut-body', [
                m('p', t('tut1body', 'fr')),
                m('p', t('tut1body', 'en')),
                m('div.list-group.mt30', [
                    m('a.list-group-item[href="#"]', {onclick: self.setDefLang('fr')}, t('tut1choice', 'fr')),
                    m('a.list-group-item[href="#"]', {onclick: self.setDefLang('en')}, t('tut1choice', 'en'))
                ])
            ])
        ])))
    }
}

tutSteps.TutStep2 = {
    oninit: function (vnode) {
        let self = this
        
    },
    view: function (vnode) {
        let self = this
        return m('div.tut-container', m('div.tut-panel', m('div.tut-content', [
            m('div.tut-header', m('h3.tut-title', t('tut2title'))),
            m('div.tut-body', [
                m('p', t('tut2body')),
                m('div.list-group.mt30', [
                    m('a.list-group-item[href="#"]', t('tut2choice1')),
                    m('a.list-group-item[href="#"]', t('tut2choice2'))
                ])
            ]),
            m('div.tut-footer', m('button.btn.btn-default.pull-left', {onclick: () => {vnode.attrs.changeStep('TutStep1')}}, t('gobackbtn')))
        ])))
    }
}

const Tutorial = {}

Tutorial.oninit = function () {
    let self = this
    self.currentStep = 'TutStep1'

    self.changeStep = (newStep) => {
        self.currentStep = newStep
        m.redraw()
    }
}

Tutorial.view = function () {
    let self = this
    return m(tutSteps[self.currentStep], {oncreate: anim.create, onremove: anim.remove, key: self.currentStep, changeStep: self.changeStep})
}

module.exports = Tutorial
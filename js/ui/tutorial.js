const m = require('mithril')
const Config = require('electron-config')
const {Animator, ValidationManager, ValidatingInput} = require('jfdcomponents')
const t = require('jfdcomponents').Translator
const RemoteAccess = require('../remoteaccess.js')
const Mousetrap = require('mousetrap')

const usbUI = require('./usbcopy.js')

const conf = new Config()
const anim = new Animator('tutorial')

const tutWindow = function (stepno, stepcount, title, body, footer, darken) {
    return m('div.tut-container' + (darken ? '.darken' : ''), m('div.tut-panel', m('div.tut-content', [
        m('div.tut-header', m('h3.tut-title', title)),
        m('div.tut-body', body),
        footer ? m('div.tut-footer', footer) : '',
        stepcount > 0 ? m('div.progress.no-margin', [
            m('div.progress-bar', {style: `width: ${Math.floor(stepno/stepcount*100)}%;`})
        ]) : ''
    ])))
}

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
        return tutWindow(
            0, Object.keys(tutSteps).length-1,
            t('tut1title'), 
            [
                m('p', t('tut1body', 'fr')),
                m('p', t('tut1body', 'en')),
                m('div.list-group.mt30', [
                    m('a.list-group-item[href="#"]', {onclick: self.setDefLang('fr')}, t('tut1choice', 'fr')),
                    m('a.list-group-item[href="#"]', {onclick: self.setDefLang('en')}, t('tut1choice', 'en'))
                ])
            ]
        )
    }
}

tutSteps.TutStep2 = {
    oninit: function (vnode) {
        let self = this
        self.setMulLang = (choice) => {
            return (e) => {
                e.preventDefault()
                conf.set('languageselection', choice)
                vnode.attrs.changeStep('TutStep3')
            }
        }
    },
    view: function (vnode) {
        let self = this
        return tutWindow(
            1, Object.keys(tutSteps).length-1,
            t('tut2title'),
            [
                m('p', t('tut2body')),
                m('div.list-group.mt30', [
                    m('a.list-group-item[href="#"]', {onclick: self.setMulLang(true)}, t('tut2choice1')),
                    m('a.list-group-item[href="#"]', {onclick: self.setMulLang(false)}, t('tut2choice2'))
                ])
            ],
            [
                m('button.btn.btn-default.pull-left', {onclick: () => {vnode.attrs.changeStep('TutStep1')}}, t('gobackbtn'))
            ]
        )
    }
}

tutSteps.TutStep3 = {
    oninit: function (vnode) {
        let self = this
        self.forms = ValidationManager()
        self.saveStoreInfo = (e) => {
            e.preventDefault()
            if (self.forms.allValid()) {
                conf.set('store.no', self.forms.fields.storeno.value)
                conf.set('store.district', self.forms.fields.districtno.value)
                vnode.attrs.changeStep('TutStep4')
            }
        }
    },
    view: function (vnode) {
        let self = this
        return tutWindow(
            2, Object.keys(tutSteps).length-1,
            t('tut3title'),
            [
                m('p', t('tut3body')),
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
            ],
            [
                m('button.btn.btn-default.pull-left', {onclick: () => {vnode.attrs.changeStep('TutStep2')}}, t('gobackbtn')),
                m('button.btn.btn-primary.pull-right', {onclick: self.saveStoreInfo}, t('continuebtn'))
            ]
        )
    }
}

tutSteps.TutStep4 = {
    oninit: function (vnode) {
        let self = this
        self.internetStatus = 'checking'
        self.checkInternet = function () {
            RemoteAccess.netTest().then((res) => {
                if (res) {
                    self.internetStatus = 'connected'
                } else {
                    self.internetStatus = 'error'
                }
                m.redraw()
            }).catch((err) => {
                self.internetStatus = 'error'
                console.error('[Request]', err)
                m.redraw()
            })
        }
        self.sendInit = function () {
            RemoteAccess.sendStoreData({installed: true}).catch((err) => {
                console.error('[Request]', err)
            })
        }
        self.checkInternet()
    },
    view: function (vnode) {
        let self = this
        return tutWindow(
            3, Object.keys(tutSteps).length-1,
            t('tut4title'),
            self.internetStatus == 'checking' ? [
                m('img.center-block.tut-image', {src: 'img/neticonsync.png'}),
                m('h4.text-center', t('tut4sync'))
            ] : self.internetStatus == 'error' ?
            [
                m('img.center-block.tut-image', {src: 'img/neticonerror.png'}),
                m('p', t('tut4error')),
                m('div.list-group.mt30', [
                    m('a.list-group-item[href="#"]', {onclick: (e) => {
                        e.preventDefault()
                        self.internetStatus = 'checking'
                        self.checkInternet()
                    }}, t('tut4retry')),
                    m('a.list-group-item[href="#"]', {onclick: (e) => {
                        e.preventDefault()
                        const {remote} = require('electron')
                        remote.getCurrentWindow().minimize()
                    }}, t('tut4minimize')),
                    m('a.list-group-item[href="#"]', {onclick: (e) => {
                        e.preventDefault()
                        self.internetStatus = 'ignorewarning'
                    }}, t('tut4ignore'))
                ])
            ] : self.internetStatus == 'connected' ? [
                m('img.center-block.tut-image', {src: 'img/neticongood.png'}),
                m('h4', t('tut4connectedheader')),
                m('p', t('tut4connected'))
            ] : self.internetStatus == 'ignorewarning' ? [
                m('h1.alert.alert-danger.intense', t('tut4warning')),
                m('p', t('tut4warningbody')),
                m('div.list-group.mt30', [
                    m('a.list-group-item[href="#"]', {onclick: (e) => {
                        e.preventDefault()
                        self.internetStatus = 'error'
                        self.checkInternet()
                    }}, t('tut4goback')),
                    m('a.list-group-item[href="#"]', {onclick: (e) => {
                        e.preventDefault()
                        vnode.attrs.changeStep('TutStep5')
                    }}, t('tut4continue'))
                ])
            ] : '',
            [
                m('button.btn.btn-default.pull-left', {onclick: () => {vnode.attrs.changeStep('TutStep3')}}, t('gobackbtn')),
                self.internetStatus == 'connected' ? m('button.btn.btn-primary.pull-right', {onclick: () => {
                    self.sendInit()
                    vnode.attrs.changeStep('TutStep5')
                }}, t('continuebtn')) : ''
            ]
        )
    }
}

tutSteps.TutStep5 = {
    view: function (vnode) {
        return tutWindow(
            4, Object.keys(tutSteps).length-1,
            t('tut5title'),
            [
                m('img.screen-shot.center-block', {src: t('tut5img')}),
                m('div.mt30'),
                m('p', t('tut5body'))
            ],
            [
                m('button.btn.btn-default.pull-left', {onclick: () => {vnode.attrs.changeStep('TutStep4')}}, t('gobackbtn')),
                m('button.btn.btn-primary.pull-right', {onclick: () => {vnode.attrs.changeStep('TutStep6')}}, t('continuebtn'))
            ]
        )
    }
}

tutSteps.TutStep6 = {
    oninit: function (vnode) {
        let self = this
        self.canContinue = false
        Mousetrap.bind('up up down down left right left right', () => {
            vnode.attrs.changeStep('TutStep7')
        })
    },

    onremove: function () {
        Mousetrap.unbind('up up down down left right left right')
    },

    view: function (vnode) {
        let self = this
        return tutWindow(
            5, Object.keys(tutSteps).length-1,
            t('usbtitle'),
            [
                m(usbUI, {onDone: (data) => {
                    RemoteAccess.sendStoreData({schools: data}).catch((err) => {
                        console.error('[Request]', err)
                    })
                    self.canContinue = true
                    m.redraw()
                }})
            ],
            [
                m('button.btn.btn-default.pull-left', {onclick: () => {vnode.attrs.changeStep('TutStep5')}}, t('gobackbtn')),
                self.canContinue ? m('button.btn.btn-primary.pull-right', {onclick: () => {vnode.attrs.changeStep('TutStep7')}}, t('continuebtn')) : ""
            ]
        )
    }
}

tutSteps.TutStep7 = {
    view: function () {
        return tutWindow(
            6, Object.keys(tutSteps).length-1,
            t('tut7title'),
            [
                m('img.tut-image.center-block', {src: t('stapleslogo')}),
                m('p', m.trust(t('tut7body'))),
                m('div.mt30'),
                m('button.btn.btn-primary.center-block', {onclick: () => {
                    conf.set('tutorialcompleted', true)
                    m.route.set('/mainscreen')
                }}, t('getstarted'))
            ]
        )
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

module.exports.Tutorial = Tutorial
module.exports.tutWindow = tutWindow
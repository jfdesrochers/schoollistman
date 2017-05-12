const m = require('mithril')
const {Animator} = require('jfdcomponents')
const t = require('jfdcomponents').Translator
const Configstore = require('configstore')

const conf = new Configstore('schoollistman')
const anim = new Animator('mainapp')

const Tutorial = require('./js/ui/tutorial.js')

const Startup = {}

Startup.oncreate = function () {
    setTimeout(() => {
        t.loadLang({
            'en': 'messages/en.yaml',
            'fr': 'messages/fr.yaml'
        }).then(() => {
            if (conf.get('tutorialcompleted')) {
                m.route.set('/mainscreen')
            } else {
                m.route.set('/tutorial')
            }
        })
    }, 2000) // Wait until the fadein has stopped.
}

Startup.view = function () {
    return [
        m('h1.maintitle.fadein', ['Bienvenue ', m('span.white', 'Welcome')]),
        m('h1.mainsubtitle.fadein', ['Chargement en cours... ', m('span.white', 'Now loading...')])
    ]
}

m.route(document.getElementById('shcontents'), '/', {
    '/': Startup,
    '/tutorial': Tutorial
})

/*[
    m('h1.maintitle', m.trust('Imprimez vos listes scolaires.')),
    m('h1.mainsubtitle', m.trust('Touchez ici pour commencer.')),
    m('img.mainlogo', {src: 'img/stapleslogofr.svg'})
]*/
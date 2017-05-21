const m = require('mithril')
const t = require('jfdcomponents').Translator
const Config = require('electron-config')

const conf = new Config()

const DataStorage = require('./js/datastorage.js')
const Tutorial = require('./js/ui/tutorial.js')
const MainScreen = require('./js/ui/mainscreen.js')

const Startup = {}

Startup.oncreate = function () {
    setTimeout(() => {
        t.loadLang({
            'en': 'messages/en.yaml',
            'fr': 'messages/fr.yaml'
        }).then(() => DataStorage.loadDBs(['schools', 'stats'])).then(() => {
            if (conf.get('tutorialcompleted')) {
                t.setLang(conf.get('defaultlanguage'))
                m.route.set('/mainscreen')
            } else {
                m.route.set('/tutorial')
            }
        })
    }, 2000) // Wait until the fadein has stopped.
}

Startup.view = function () {
    return [
        m('h1.maintitle.fadein.white', 'Bienvenue'),
        m('h1.maintitle.secondary.fadein', 'Welcome'),
        m('h1.mainsubtitle.fadein.white', 'Chargement en cours... '),
        m('h1.mainsubtitle.secondary.fadein', 'Now loading...')
    ]
}

m.route(document.getElementById('shcontents'), '/', {
    '/': Startup,
    '/tutorial': Tutorial,
    '/mainscreen': MainScreen
})
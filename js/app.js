const m = require('mithril')
const {Animator} = require('jfdcomponents')

const anim = new Animator()

m.route(document.getElementById('shcontents'), '/', {
    '/': Test1
})
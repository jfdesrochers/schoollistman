const m = require('mithril')
const Animator = require('./js/utils/animator.js')

const anim = new Animator()

m.route(document.getElementById('shcontents'), '/', {
    '/': Test1
})
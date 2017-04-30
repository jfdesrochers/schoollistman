
const Animator = function (namespace) {
    let self = this
    let history = []
    let lastNode = null

    const getDirection = (nextkey, lastkey) => {
        let direction = 'next'
        if (sessionStorage.getItem(namespace)) {
            history = JSON.parse(sessionStorage.getItem(namespace))
        }
        let idx = history.indexOf(nextkey)
        if (idx > -1) {
            direction = 'prev'
            if (idx == 0) {
                history = []
            } else {
                history = history.slice(0, idx)
            }
        } else {
            history.push(lastkey)
        }
        sessionStorage.setItem(namespace, JSON.stringify(history))
        return direction
    }

    self.create = (vnode) => {
        if (!vnode.key) return
        const id = 'anim' + Date.now()
        
        if (lastNode) {
            let direction = getDirection(vnode.key, lastNode.key)
            console.log(history, direction)
            let lastElem = lastNode.dom
            let uncompleted = true

            lastElem.setAttribute('data-anim-id', id)
            vnode.dom.parentNode.insertAdjacentHTML('beforeend', lastElem.outerHTML)
            lastElem = vnode.dom.parentNode.querySelector('[data-anim-id=' + id + ']')

            const animEnd = (e) => {
                const elem = e.target
                elem.removeEventListener('animationend', animEnd)
                if (elem.getAttribute('data-anim-id')) {
                    elem.parentNode.removeChild(elem)
                }
                if (uncompleted) {
                    uncompleted = false
                } else {
                    document.body.classList.remove('anim-parent')
                    vnode.dom.parentNode.classList.remove('anim-parent')
                    vnode.dom.classList.remove('anim-next-element', 'anim-direction-' + direction)
                }
            }
            lastElem.addEventListener('animationend', animEnd)
            vnode.dom.addEventListener('animationend', animEnd)
            
            document.body.classList.add('anim-parent')
            vnode.dom.parentNode.classList.add('anim-parent')
            lastElem.classList.add('anim-last-element', 'anim-direction-' + direction)
            vnode.dom.classList.add('anim-next-element', 'anim-direction-' + direction)
        }
    }

    self.remove = (vnode) => {
        if (!vnode.key) return
        lastNode = {
            key: vnode.key,
            dom: vnode.dom
        }
    }
}

module.exports = Animator
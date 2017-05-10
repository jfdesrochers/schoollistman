const yaml = require('js-yaml')

const setCookie = function(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    var expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + "; " + expires;
};

var currentLang = document.cookie.replace(/(?:(?:^|.*;\s*)currentlang\s*\=\s*([^;]*).*$)|^.*$/, "$1") || navigator.language || navigator.userLanguage || "en"
currentLang = currentLang.substr(0, 2);

const t = function (translateKey, translateToLang) {
    const curLang = translateToLang || currentLang
    
}

t.setLang = function (newLang) {
    currentLang = newLang
}

module.exports = t
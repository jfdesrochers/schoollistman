setCookie = function(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    var expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + "; " + expires;
};

const t = function (translateKey, translateToLang) {
    const curLang = translateToLang || t._currentLang || document.cookie.replace(/(?:(?:^|.*;\s*)currentlang\s*\=\s*([^;]*).*$)|^.*$/, "$1") || navigator.language || navigator.userLanguage || "en";
    curLang = curLang.substr(0, 2);
}

t.setLang = function (newLang) {
    t._currentLang = newLang
}

module.exports = t
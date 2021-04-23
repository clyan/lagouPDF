// 提供已登录的cookie

const cookie = '填写你cookie'

const addCookies = async (cookies_str, page, domain) => {
    let cookies = cookies_str.split(';').map(
        pair => {
        let name = pair.trim().slice(0, pair.trim().indexOf('='));
        let value = pair.trim().slice(pair.trim().indexOf('=') + 1);
        return {name, value, domain}
    });
    await Promise.all(cookies.map(pair => {
        // console.log(pair);
        return page.setCookie(pair)
    }))
};

module.exports = {
    cookie,
    addCookies
};
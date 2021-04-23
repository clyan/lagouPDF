const puppeteer = require('puppeteer');
const cookie = require('./cookie')



// 不提供cookie时，模拟登陆
async function Login (page) {
    const login = await page.waitForSelector('.not-login-item', { visible: true })
    login.click();
    const account = await page.waitForSelector('.account-s', { visible: true })
    if(!account) {
        return 
    }
    const username= '18890052317';
    const password= '1570555124..';
    const accounts = await page.$$('.account-s');
    accounts[1].click();
    await page.waitForSelector('[type = password]', { visible: true })
    const inputs = await page.$$('.forms-top-code .input');
    
    await inputs[2].type(username);
    await inputs[3].type(password);
    
    const loginBtn = await page.waitForSelector('.login-btn', { visible: true })
    await page.setExtraHTTPHeaders({
        "sec-ch-ua": "Google Chrome;v=89, Chromium;v=89, ;Not A Brand;v=99",
        "sec-ch-ua-mobile": "?0",
        "pragma": "no-cache",
        "Sec-Fetch-Dest": "empty"
    })
    loginBtn.click();
}
//
(async () => {
    try {
        const browser = await puppeteer.launch({
            headless: false
        });

        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36');
        await page.setDefaultNavigationTimeout(6 * 10 * 1000)
        await page.setViewport({
            width: 1520,
            height: 1080
        })
      
        await page.goto('https://kaiwu.lagou.com/');

        const closeDiglog = await page.waitForSelector('.close', { visible: true })
        closeDiglog.click();

        await Login(page);
        // const offset = await page.evaluate(() => {
        //     let offset_ifr = $('iframe').offset()
            
        //     return {
        //     top: offset_ifr.top + 222,
        //     left: offset_ifr.left + 10
        //     }
        // })
        


    } catch (e) {
        console.log('err', e)
    }

})();



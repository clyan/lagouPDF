const puppeteer = require('puppeteer');
const { cookie, addCookies } = require('../cookie')
const path = require('path');
const fs = require('fs');
const { pool } = require('../util/pool')
async function hideHeader(page) {
    await page.evaluate(() => {
        const pcHeader = document.querySelector('.pc-header');
        if (pcHeader) {
            pcHeader.style.display = 'none';
        }
        const pubHeader = document.querySelector('.pub-header');
        if (pubHeader) {
            pubHeader.style.display = 'none';
        }
    });
}
async  function showHeader(page) {
    await page.evaluate(() => {
        const pcHeader = document.querySelector('.pc-header');
        if (pcHeader) {
            pcHeader.style.display = 'block';
        }
        const pubHeader = document.querySelector('.pub-header');
        if (pubHeader) {
            pubHeader.style.display = 'block';
        }
    });
}

async function preHandle(page) {
    // 收起左边栏
    const catalog = await page.waitForSelector('.catalog', { visible: true });
    await catalog.click();
    // 隐藏头部
    await hideHeader(page);
    // 将页面高度设置成auto
    await page.evaluate(() => {
        const content = document.querySelector('.right-content-wrap');
        if (content) {
            content.style.height = 'auto';
        }
    });
}

async function postHandle(page) {
    // 隐藏头部
    await showHeader(page);
    // 打开左边栏
    const catalog = await page.waitForSelector('.catalog', { visible: true });
    await catalog.click();
}
(async () => {
    try {
        //  只用于获取课程条目
        let {page, len} = await pool.use(async browser => {
            const page = await browser.newPage();
            page.setDefaultNavigationTimeout(6 * 10 * 1000)
            page.setViewport({
                width: 1520,
                height: 1080
            })
            console.log("ready start")
            await addCookies(cookie, page, 'kaiwu.lagou.com');
            await page.goto('https://kaiwu.lagou.com/hasBuy/special',{
                waitUntil: 'networkidle0'
            });
            await page.waitForSelector('.course-ul-pc .course-li.pay-padding', { visible: true })
            // 所有课程
            const courseLis = await page.$$('.course-ul-pc .course-li.pay-padding');
            let i = 1;
            let len = courseLis.length;
            return {
                page,
                len
            };
        })

        console.log(len)
        // 开启多个实例
        for(let i = 0;i < len; i++) {
             pool.use(async browser => {
                const page = await browser.newPage();
                page.setDefaultNavigationTimeout(6 * 10 * 1000)
                page.setViewport({
                    width: 1520,
                    height: 1080
                })
                console.log("ready start")
                await addCookies(cookie, page, 'kaiwu.lagou.com');
                await page.goto('https://kaiwu.lagou.com/hasBuy/special',{
                    waitUntil: 'networkidle0'
                });
                await page.waitForSelector('.course-ul-pc .course-li.pay-padding', { visible: true })
                // 所有课程
                const courseLis = await page.$$('.course-ul-pc .course-li.pay-padding');

                await getOneCourse(i, page)
                async function getOneCourse(i, page) {
                    const courseLis = await page.$$('.course-ul-pc .course-li.pay-padding');
                    let courseName = await page.evaluate((i) => {
                        const span = document.querySelectorAll('.course-ul-pc .course-li.pay-padding .pay-course-main .p-title span')[i]
                        return span.innerText;
                    }, i)
                    courseName = courseName.replace(/[/\\\\:："'’“”*?<>,，+| \n\t]/g, '')
                    // 创建课程目录
                    const pathName = path.join(__dirname, `../pdfs/${courseName}`)
                    if(!fs.existsSync(pathName)) {
                        fs.mkdirSync(pathName);
                    }
                    
                    console.log("courseName", courseName)
                    //第i课程
                    courseLis[i].click();
                    await page.waitForSelector('.class-menu-box .class-menu-block .class-level-one:not(.iswait)', { visible: true })
                    // 课程的所有章节,排除未更新的。
                    const details = await page.$$('.class-menu-box .class-menu-block .class-level-one:not(.iswait)')
                   
                    for( let j = 0; j < details.length; j++) {
                        await getLesson(j, page)
                    }
                    async function getLesson(j, page) {
                    const a = await page.$$('.class-menu-box .class-menu-block .class-level-one:not(.iswait)')
                    await a[j].click()
        
                    // 每个章节一个pdf
                    let  pdfName = await a[j].$eval(".content", el => el.innerText);
                    pdfName = pdfName.replace(/[/\\\\:："'’“”*?<>,，+| \n\t]/g, '');
                    console.log("pdfName", pdfName)
                    //已存在则直接跳过
                    const pdfPath = path.join(__dirname, `../pdfs/${courseName}/${pdfName}.pdf`)
                    const isExistxFile = fs.existsSync(pdfPath)
                    if(isExistxFile) return;
        
                    
                    // 隐藏不必要的内容
                    await preHandle(page);
                    console.log("waitForResponse")
                    await page.waitFor(3000)
                    await page.pdf({
                        path: pdfPath
                    })
        
                    // 将页面重新恢复至初始状态
                    await postHandle(page);
                   }
                }
        })
        }
    } catch(err) {
        console.log('err', err)
    }
})()
   
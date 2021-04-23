const puppeteer = require('puppeteer');
const { cookie, addCookies } = require('./cookie')
const path = require('path');
const fs = require('fs');
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
        const browser = await puppeteer.launch({
            headless: true, // 无头才能产生pdf 
        });
        const page = await browser.newPage();
        page.setDefaultNavigationTimeout(6 * 10 * 1000)
        page.setViewport({
            width: 1520,
            height: 1080
        })
        console.log("开始")
        await addCookies(cookie, page, 'kaiwu.lagou.com');
        await page.goto('https://kaiwu.lagou.com/hasBuy/special',{});
        await page.waitForSelector('.course-ul-pc .course-li.pay-padding', { visible: true })

        // 所有课程
        const courseLis = await page.$$('.course-ul-pc .course-li.pay-padding');
        let i = 0;
        let len = courseLis.length;
        console.log("ready  courseLis", len)
        for(;i < len; i++) {
            if(i >= 1) {
                await page.goto('https://kaiwu.lagou.com/hasBuy/special');
                await page.waitForSelector('.course-ul-pc .course-li.pay-padding', { visible: true })
            }
            await getOneCourse(i, page)
        }

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
            
            console.log("课程名", courseName)
            //第i课程
            courseLis[i].click();
            await page.waitForSelector('.class-menu-box .class-menu-block .class-level-one:not(.iswait)', { visible: true })
            // 课程的所有章节,排除未更新的。
            const details = await page.$$('.class-menu-box .class-menu-block .class-level-one:not(.iswait)')
            const ready = fs.readdirSync(path.join(__dirname,`../pdfs/${courseName}`));
            console.log(details.length, ready.length)
            // 全部已经爬取完成
            if(details.length === ready.length) {
                return;
            }
            for( let j = 0; j < details.length; j++) {
                await getLesson(j, page)
            }
            async function getLesson(j, page) {
            const a = await page.$$('.class-menu-box .class-menu-block .class-level-one:not(.iswait)')
            await a[j].click()

            // 每个章节一个pdf
            let  pdfName = await a[j].$eval(".content", el => el.innerText);
            pdfName = pdfName.replace(/[/\\\\:："'’“”*?<>,，+| \n\t]/g, '');
            console.log("章节名", pdfName)
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
        console.log("end")
        await browser.close();
    } catch (e) {
        console.log('err', e)
    }
})();



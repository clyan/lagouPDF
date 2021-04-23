
拉钩专栏转换为PDF
> 说明：该项目仅仅只能用户个人学习使用，不能在商业中使用，若拉钩时间官方要求该代码仓库删除，请联系我进行删除
# 安装依赖

```bash
  yarn
```

先登录拉勾网，获取cookie, 添加cookie到src/cookie.js中



# 问题
1. 反爬机制

  使用puppteer访问时，出现是点触验证码，而正常访问是滑动验证码

  解决： 直接使用cookie登录

2. 超时
  page.waitForNavigation 超时
  直接使用 waitFor('合适的时间')


3. 爬取内容过多
  先访问获取课程的数量，创建多个puppteer实例，加入连接池。
  需要登录访问的页面，启动多个实例，会出现排挤，自动退出，
  如果打开多个page页又会存在， 打印pdf 占用问题。
  暂时就只能一个实例打印。


4. 上下文丢失
    Node is detached from document
    页面隐藏了一些元素，再显示这些元素， 使用之前获取的元素会出现上下文丢失
```js
const courseLis = await page.$$('.course-ul-pc .course-li.pay-padding');
getOneCourse(0, page, courseLis)
async function getOneCourse(i, page, courseLis) {
    // 新增：
    // const courseLis = await page.$$('.course-ul-pc .course-li.pay-padding');
    courseLis[i].click();
    //隐藏元素，再显示元素，导致Node is detached from document
    await hideHeader(page);

    await showHeader(page);
}
```
解决办法： 再一次获取, 不使用隐藏前以获取元素


# src/more/ hasLogin（不可用）
  存在问题：
    点触验证码：暂时没有好的方案，puppteer启动后，该网站使用的是此验证方式。
    普通验证码：参考 tesseract.js 
    滑动式验证： 参考 [使用 Node.js 模拟滑动拼图验证码操作](https://www.jb51.net/article/127385.htm)

# src/more/ poolIndex（不可用）
  存在问题：登录失效

# 其他
  做完才发现有写好的
  [极客](https://github.com/jjeejj/geektime2pdf)
  [拉勾](https://github.com/lichangao1826/lagou2pdf)
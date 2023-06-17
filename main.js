const superagent = require("superagent");
const cheerio = require("cheerio");
const art_template = require("art-template");
const path = require("path");
const nodemailer = require("nodemailer");
let schedule = require("node-schedule");

function getDayData() {
    return new Promise((resolve, reject) => {
        const today = new Date();
        // 认识时间
        const meet = new Date("2017-06-08");
        //天数
        const countDay = Math.ceil((today - meet) / 1000 / 60 / 60 / 24);
        //日期格式

        const getDateFormat = () => {
            const y = today.getFullYear();
            const m = (today.getMonth() + 1).toString().padStart(2, "0");
            const d = today.getDate().toString().padStart(2, "0");
            return `${y}-${m}-${d}`;
        };

        const timeData = {
            countDay,
            format: getDateFormat(),
        };
        // console.log(timeData);
        resolve(timeData);
    });
}

function catchWeatherData() {
    return new Promise((resolve, reject) => {
        superagent
            .get("https://tianqi.moji.com/weather/china/guangdong/zhaoqing")
            .end((err, res) => {
                if (err) return console.log("data require failed !");
                // console.log(res.text);
                const $ = cheerio.load(res.text);
                //图标
                const icon = $(".wea_weather span img").attr("src");
                //头像
                const avator = $(".wea_info_avator img").attr("src");
                //天气
                const weather = $(".wea_weather b").text();
                //温度
                const temperature = $(".wea_weather em").text();
                //湿度
                const humidness = $(".wea_about span, .wea_about em, .wea_about b").text();
                //提示
                const tips = $(".wea_tips em").text();
                const weatherData = {
                    icon,
                    avator,
                    weather,
                    temperature,
                    humidness,
                    tips,
                };
                resolve(weatherData);
                // console.log(weatherData);
            });
    });
}

function catchOneData() {
    return new Promise((resolve, reject) => {
        superagent.get("http://wufazhuce.com/").end((err, res) => {
            if (err) return console.log("data require failed !");
            const $ = cheerio.load(res.text);
            const img = $(".carousel-inner>.item>img, .carousel-inner>.item>a>img")
                .eq(0)
                .attr("src");
            const text = $(".fp-one .fp-one-cita-wrapper .fp-one-cita a").eq(0).text();
            const oneData = {
                img,
                text,
            };
            resolve(oneData);
            // console.log(oneData);
        });
    });
}

async function renderTemplate() {
    //获取日期数据
    const dayData = await getDayData();
    //获取天气数据
    const weatherData = await catchWeatherData();
    //获取one数据
    const oneData = await catchOneData();
    console.log("oneData", oneData);

    return new Promise((resolve, reject) => {
        const html = art_template(path.join(__dirname, "./index.html"), {
            dayData,
            weatherData,
            oneData,
        });
        resolve(html);
        // console.log(html);
    });
}

async function sendModeMail() {
    const html = await renderTemplate();
    console.log("render template completed!");

    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
        host: "smtp.163.com",
        port: 465,
        secure: true, // true for 465, false for other ports
        auth: {
            user: "tao_dream518@163.com", // generated ethereal user
            pass: "qwer1234", // generated ethereal password
        },
    });

    let mailOptions = {
        from: '"暖男" <tao_dream518@163.com>', // sender address
        to: "1176066952@qq.com", // list of receivers
        subject: "来自暖男666发来的email", // Subject line
        html: html, // html body
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptions, (error, info = {}) => {
        if (error) {
            console.log(error);
            sendModeMail();
        }
        console.log("send successfully!");
        console.log("send await!");
    });
}
// sendModeMail();

//秒，分，时，日，月，周几，年
var j = schedule.scheduleJob("00 20 5 * * *", function () {
    sendModeMail();
    console.log("邮件已发送！");
});

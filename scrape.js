const puppeteer = require('puppeteer');
require('dotenv').config();
const { token, username, password } = require('./config.json');
const fs = require('fs');
var cron = require('node-cron');
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ],
});

async function checkLink(){
    // Start a Puppeteer session with:
    // - a visible browser (`headless: false` - easier to debug because you'll see the browser in action)
    // - no default viewport (`defaultViewport: null` - website page will in full width and height)
    const browser = await puppeteer.launch({
        headless: true,
        defaultViewport: null,
    });

    // Open a new page
    const page = await browser.newPage();

    // On this new page:
    // - open the "http://quotes.toscrape.com/" website
    // - wait until the dom content is loaded (HTML is ready)

    await page.goto("https://app.musicleague.com/l/20bc40cc2fff4297b3702762baef47be/", {
        waitUntil: "domcontentloaded",
    });

    //await page.goto("https://app.musicleague.com/l/46954fbf240e469bbea9fb5824941f67/", {
        //waitUntil: "domcontentloaded",
    //});

    //logins into spotify
    await page.click('body > div > div > div > div > div > div.row.mt-3 > div > div > a');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    await page.type("#login-username", username);
    await page.type("#login-password", password);

    await page.click('#login-button');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });



    //finds the current playlist link
    await page.click('#encore-web-main-content > div > main > section > div > div > div:nth-child(4) > button');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    const oldLink = fs.readFileSync('link.txt', 'utf8', (err, data) => {
        if (err) throw err;
        return data;
    });

    //console.log(oldLink);

    const link = await page.$eval('#app > div:nth-child(3) > div.py-5 > div > div > div > div:nth-child(1) > div > div > div.row.py-3.align-items-center > div:nth-child(1) > a', element => element.getAttribute('href'));
    const weekName = await page.$eval('#app > div:nth-child(3) > div.py-5 > div > div > div > div:nth-child(1) > div > div > div:nth-child(1) > div > h5', element => element.innerText);
    let weekTag = await page.$eval('#app > div:nth-child(3) > div.py-5 > div > div > div > div:nth-child(1) > div > div > div.row.py-3.align-items-center > div:nth-child(2) > a', element => element.getAttribute('href'));
    let frontTag = "https://app.musicleague.com"
    let weekLink = frontTag.concat(weekTag);
    const leagueName = await page.$eval('#app > div:nth-child(3) > div.container > div.row.leagueHeader.my-5 > div > div > div.col-12.col-lg-8.gx-0 > div.row.p-3.gx-0 > div > h3', element => element.innerText);
    console.log("playlist link is " + link);
    console.log("weekName is " + weekName);
    console.log("weekLink is " + weekLink);
    console.log("leagueName is " + leagueName);
    fs.writeFileSync('link.txt', link);

    const channel = client.channels.cache.get('1049795501400264765');

    if (!(oldLink == link)) {
        //send discord message
        if (link == "") {
            channel.send("'" + weekName + "' on " + leagueName + " is now open for submissions!\n" + weekLink);
        }
        else {
            channel.send("Check out the '" + weekName + "' playlist on " + leagueName + "!\n" + link);
        }
    }
    else {
        //do nothing
    }
    return;
}

client.on('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    await checkLink();
});

cron.schedule('* * * * *', async () => {
    await checkLink();
});

client.login(token);

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
        headless: false,
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
    //return;
    await page.click('body > div.container.my-5 > div > div:nth-child(3) > div > a');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    await page.type("#login-username", username);
    await page.type("#login-password", password);

    await page.click('#login-button');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });



    //finds the current playlist link
    await page.click('#encore-web-main-content > div > main > section > div > div > div:nth-child(5) > button');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    const oldLink = fs.readFileSync('link.txt', 'utf8', (err, data) => {
        if (err) throw err;
        return data;
    });

    //console.log(oldLink);
    const playlistLink = await page.$eval('body > div:nth-child(1) > div.container.my-5 > div > div > div > div > div > div > div.row.my-3.justify-content-center > div:nth-child(1) > a', element => element.getAttribute('href'));
    const weekName = await page.$eval('body > div:nth-child(1) > div.container.my-5 > div > div > div > div > div > div > div:nth-child(1) > div.col > h5', element => element.innerText);
    let submitTag = await page.$eval('body > div:nth-child(1) > div.container.my-5 > div > div > div > div > div > div > div.row.my-3.justify-content-center > div > a', element => element.getAttribute('href'));
    let frontTag = "https://app.musicleague.com"
    let submitLink = frontTag.concat(submitTag);
    const leagueName = await page.$eval('body > div:nth-child(1) > div.bg-body > div > div > div > div.d-none.d-sm-block > div > div > div.col-9 > div.card-body.p-3 > div:nth-child(1) > div.col > h4 > a', element => element.innerText);
    console.log("playlist link is " + playlistLink);
    console.log("weekName is " + weekName);
    console.log("weekLink is " + submitLink);
    console.log("leagueName is " + leagueName);
    fs.writeFileSync('link.txt', playlistLink);

    const channel = client.channels.cache.get('1049795501400264765');

    if (!(oldLink == playlistLink)) {
        //send discord message
        if (link == "") {
            channel.send("'" + weekName + "' on " + leagueName + " is now open for submissions!\n" + submitLink);
        }
        else {
            channel.send("Check out the '" + weekName + "' playlist on " + leagueName + "!\n" + playlistLink);
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

//cron.schedule('* * * * *', async () => {
    //await checkLink();
//});

client.login(token);

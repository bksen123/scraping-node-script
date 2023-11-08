const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const asyncS = require("async");
puppeteer.use(StealthPlugin());

async function scrollPage(page, scrollContainer) {
  let lastHeight = await page.evaluate(`document.querySelector("${scrollContainer}").scrollHeight`);

  while (true) {
    await page.evaluate(`document.querySelector("${scrollContainer}").scrollTo(0, document.querySelector("${scrollContainer}").scrollHeight)`);
    await page.waitForTimeout(5000);
    let newHeight = await page.evaluate(`document.querySelector("${scrollContainer}").scrollHeight`);
    if (newHeight === lastHeight) {
      break;
    }
    lastHeight = newHeight;
  }
}

async function fillDataFromPage(page) {
  const dataFromPage = await page.evaluate(() => {
    return Array.from(document.querySelectorAll(".Nv2PK")).map((el) => {
      const locationName = el.querySelector(".qBF1Pd")?.textContent.trim();
      const addressElement = el.querySelector(".W4Efsd:last-child > .W4Efsd:nth-of-type(1) > span:last-child");
      const address = addressElement ? addressElement.textContent.replaceAll("·", "").trim() : "";

      // Additional information
      const locatonDetails = el.querySelector(".hfpxzc")?.getAttribute("href");
      const keyword = el.querySelector(".qBF1Pd + span")?.textContent.trim();
      const postCode = el.querySelector(".cfS6ac")?.textContent.trim();
      const tel = el.querySelector(".dLRLre")?.textContent.trim();
      const googleMapsLink = el.querySelector("a[data-value]")?.getAttribute("href");
      const website = el.querySelector("a[data-value]")?.getAttribute("data-url");
      const email = el.querySelector('a[href^="mailto:"]')?.textContent;
      console.log("locatonDetails", locatonDetails);
      return {
        locationName,
        locatonDetails,
        keyword,
        postCode,
        address,
        tel,
        googleMapsLink,
        website,
        email,
      };
    });
  });
  return dataFromPage;
}

async function getLocalPlacesInfo(requestParams) {
  const browser = await puppeteer.launch({
    headless: false,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  const URL = `${requestParams.baseURL}/maps/search/${requestParams.query}?hl=${requestParams.hl}`;

  await page.setDefaultNavigationTimeout(60000);
  await page.goto(URL);

  await page.waitForNavigation();

  const scrollContainer = ".m6QErb[aria-label]";
  const localPlacesInfo = [];

  await page.waitForTimeout(2000);
  await scrollPage(page, scrollContainer);
  page.on('console', (msg) => {
    console.log('Page Log:', msg.text());
  });
  localPlacesInfo.push(...(await fillDataFromPage(page)));

  await browser.close();

  return localPlacesInfo;
}

var fs = require('fs');

asyncS.forEachSeries(['hall', 'sports hall'], (item, callback) => {
  console.log("item=======", item);
  const requestParams = {
    baseURL: `http://google.com`,
    query: item + ' 452011', // what we want to search
    hl: "en", // parameter defines the language to use for the Google maps search
  };
  let resp = getLocalPlacesInfo(requestParams).then((locations) => {
    console.log("locations=========", locations, locations.length)
    if (locations.length) {
      fs.writeFile(item + '.json', JSON.stringify(locations), 'utf8', (err, data) => {
        callback();
      });
    } else {
      callback();
    }
  });
}, () => {
  console.log('Scraping completed.');
});

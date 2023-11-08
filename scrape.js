const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const asyncS = require("async");
puppeteer.use(StealthPlugin());
var fs = require('fs');


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

async function getLocationLinkBehalfkeyword(page) {
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
      // console.log("locatonDetails", locatonDetails);
      return {
        locationName,
        locatonDetails,
        // keyword,
        // postCode,
        // address,
        // tel,
        // googleMapsLink,
        // website,
        // email,
      };
    });
  });
  return dataFromPage;
}

async function getLocationListBehalfKeyword(requestParams) {
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
  localPlacesInfo.push(...(await getLocationLinkBehalfkeyword(page)));

  await browser.close();

  return localPlacesInfo;
}

// var keywordList = ['hall', 'school', 'village hall', 'sports hall', 'dance hall', 'College University', 'Church hall', 'Scout hut', 'Leisure Center', 'Club hall'] 
var keywordList = ['Church hall', 'pink flower school'] 
// var keywordList = ['Church hall', 'Scout hut'];
var postalcode = '452011'



console.log('Scraping started.');
asyncS.forEachSeries(keywordList, (keyword, callback) => {
  console.log("keyword=======", keyword, postalcode);
  const requestParams = {
    baseURL: `http://google.com`,
    query: keyword + ' '+postalcode, // what we want to search
    // query: keyword + ' 452011', // what we want to search
    hl: "en", // parameter defines the language to use for the Google maps search
  };
  getLocationListBehalfKeyword(requestParams).then((locations) => {
    console.log(locations.length, " Location of this keyword =", keyword)
    if (locations.length) {
      fs.writeFile('locations-json/'+keyword + '.json', JSON.stringify(locations), 'utf8', (err, data) => {
        getLocationAllDetailsFromPage(keyword, ()=> {
          console.log('Finished this one keywork Please check your json file', keyword)
          callback();
        });
      });
    } else {
      callback();
    }
  });
}, () => {
  console.log("YOUR SCRIPT HAS BEEN DONE SUCCESSFULLY....")
  // getLocationAllDetailsFromPage();
});


//HERE START CODE FOR PERTICULER LOCATION DETAILS
async function getLocationAllDetailsFromPage (keyword, mainCb) {
  fs.readFile('locations-json/'+keyword + '.json', 'utf8', function readFileCallback(err, data){
    if (err){
        console.log(err);
        console.log('there is no json for ', keyword)
        return mainCb();
    } else {
      let locationsList = JSON.parse(data); //now it an object
      QueryForLocation(keyword, locationsList, ()=> {
        return mainCb();
      })
    }
  });
  // asyncS.forEachSeries(keywordList, (keyword, callback) => {
  //   // console.log("keyword===========", keyword);
  //   fs.readFile('locations-json/'+keyword + '.json', 'utf8', function readFileCallback(err, data){
  //     if (err){
  //         console.log(err);
  //         callback('there is no json for ', keyword)
  //     } else {
  //       let locationsList = JSON.parse(data); //now it an object
  //       QueryForLocation(keyword, locationsList, ()=> {
  //         callback()
  //       })
  //     }
  //   });
  // }, () => {
  //   console.log('Scraping end please check your json.');
  // });
}

async function QueryForLocation(keyword, locationsList, MainCallBack) {
  asyncS.forEachSeries(locationsList, (item, callback) => {
    // console.log("item=======", item);
    const requestParams = {
      baseURL: item.locatonDetails,
      hl: "en", // parameter defines the language to use for the Google maps search
    };
    PlacesInfo(requestParams).then((locationItem) => {
      // console.log("locationItem=========", locationItem)
      const foundItemIndex = locationsList.findIndex( (l)=> l.locationName ===  locationItem.locationName)
      if(foundItemIndex >= 0) {
        let locatonDetails = locationsList[foundItemIndex].locatonDetails;
        locationsList[foundItemIndex] = locationItem;
        // locationsList[foundItemIndex].locatonDetails = locatonDetails;
      }
      callback();       
    });
  }, () => {
     if (locationsList.length) {
        fs.writeFile('locations-json/'+keyword + '.json', JSON.stringify(locationsList), 'utf8', (err, data) => {
          return MainCallBack();    
        });
      } else {
        return MainCallBack();
      }
  });
}


async function fillPage(page) {
  const dataFromPage = await page.evaluate(() => {
    return Array.from(document.querySelectorAll(".XltNde")).map((el) => {
      const locationName = el.querySelector(".DUwDvf")?.textContent.trim();
      let addressElement = el.querySelector(".rogA2c");
      let address = addressElement.textContent.trim();
      // const addressElement = el.querySelector(".AeaXub:last-child > .W4Efsd:nth-of-type(1) > span:last-child");
      // const address = addressElement ? addressElement.textContent.replaceAll("·", "").trim() : "";

      // Additional information
      const viewL = el.querySelector(".hfpxzc")?.getAttribute("href");
      // const keyword = el.querySelector(".qBF1Pd + span")?.textContent.trim();
      // const postCode = el.querySelector(".cfS6ac")?.textContent.trim();
      const postCode = address.split(' ')[address.split(' ').length-1];
      // const tel = el.querySelector(".dLRLre")?.textContent.trim();
      let  tel = el.querySelector('button[data-tooltip="Copy phone number"]')?.getAttribute("aria-label");
      if(tel) {
        tel = tel.split('Phone:')[1].trim();
      }
      const googleMapsLink = el.querySelector('a[data-tooltip="Open booking link"]')?.getAttribute("href");
      const website = el.querySelector('a[data-tooltip="Open website"]')?.getAttribute("href");
      // const email = el.querySelector('a[href^="mailto:"]')?.textContent;
      console.log("EXTRACT THIS ONE LOCATION STARTED ###############################", );
        console.log("locationName", locationName);
        // console.log("keyword", keyword);
        console.log("postCode", postCode);
        console.log("address", address);
        console.log("tel", tel);
        console.log("googleMapsLink", googleMapsLink);
        console.log("website", website);
        // console.log("email", email);
      console.log("EXTRACT THIS ONE LOCATION  DONE ###############################", );
      return {
        locationName,
        // keyword,
        postCode,
        address,
        tel,
        googleMapsLink,
        website,
        // email,
      };
    });
  });
  return dataFromPage;
}

async function PlacesInfo(requestParams) {
  const browser = await puppeteer.launch({
    headless: false,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  const URL = `${requestParams.baseURL}?hl=${requestParams.hl}`;
  // const URL = `${requestParams.baseURL}/maps/search/${requestParams.query}?hl=${requestParams.hl}`;

  await page.setDefaultNavigationTimeout(60000);
  await page.goto(URL);

  await page.waitForNavigation();

  const scrollContainer = ".m6QErb[aria-label]";
  // let localPlacesInfo = {};

  await page.waitForTimeout(3000);
  await scrollPage(page, scrollContainer);
  page.on('console', (msg) => {
    console.log(msg.text());
  });
  let locationRes = await fillPage(page);

  await browser.close();
  // console.log("locationRes======", locationRes);
  return locationRes.length ? locationRes [0] : {};
}



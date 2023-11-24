const axios = require('axios');
const cheerio = require('cheerio');
const { parse: urlParse, resolve: urlResolve } = require('url');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function getTagsFromUrl(url, tagSelector) {
  try {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    };

    const response = await axios.get(url, { headers });
    const $ = cheerio.load(response.data);
    const tags = $(tagSelector).map((_, element) => $(element).text().trim()).get();
    return tags;
  } catch (error) {
    if (error.response) {
      const { status } = error.response;
      if (status === 403) {
        console.log(`Error 403: Access forbidden for URL: ${url}`);
      } else if (status === 404) {
        console.log(`Error 404: URL not found: ${url}`);
      } else {
        console.log(`HTTP Error: ${status} - ${error.message}`);
      }
    } else {
      console.log(`Error: ${error.message}`);
    }
    return null;
  }
}

async function getCrawledData(mainInput, tagSelector) {
  try {
    const parsedUrl = urlParse(mainInput);
    const mainUrl = parsedUrl.scheme && parsedUrl.netloc ? mainInput : `https://www.freepik.com/free-photos-vectors/${mainInput.replace(' ', '-')}`;

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    };

    const mainResponse = await axios.get(mainUrl, { headers });
    const mainTags = await getTagsFromUrl(mainUrl, tagSelector);

    const uniqueTags = new Set(mainTags);

    if (mainTags) {
      console.log(`Best 3 Tags from Each Images (1st Page) - ${mainUrl}:`);
      console.log(mainTags.join(', '));
      console.log('-'.repeat(50));
    }

    const links = $('body.new-resource-list .filter-tags-row .tag-slider--list li a, body.new-resource-list .no-results--popular .tag-slider--list li a')
      .map((_, element) => urlResolve(mainUrl, $(element).attr('href')))
      .get();

    for (const link of links) {
      const tags = await getTagsFromUrl(link, tagSelector);
      if (tags) {
        tags.forEach(tag => uniqueTags.add(tag));
        await new Promise(resolve => setTimeout(resolve, 1000)); // Add a 1-second delay between requests to avoid being blocked
      }
    }

    console.log('Tags from All Slider Tags:');
    console.log([...uniqueTags].join(', '));
    console.log('-'.repeat(50));

    displayAllTags([...uniqueTags]);

  } catch (error) {
    if (error.response) {
      const { status } = error.response;
      if (status === 403) {
        console.log(`Error 403: Access forbidden for URL: ${mainUrl}`);
      } else if (status === 404) {
        console.log(`Error 404: URL not found: ${mainUrl}`);
      } else {
        console.log(`HTTP Error: ${status} - ${error.message}`);
      }
    } else {
      console.log(`Error: ${error.message}`);
    }
  }
}

function displayAllTags(uniqueTags) {
  const allUniqueTags = [...new Set(uniqueTags)];
  console.log('All Unique Tags (after removing duplicates):');
  console.log(allUniqueTags.join(', '));
  console.log('-'.repeat(50));
}

// Prompt the user for a main link or keyword to crawl
rl.question('Enter the main link or keyword to crawl: ', (mainInput) => {
  getCrawledData(mainInput, '.showcase .showcase__item.showcase__item--buttons .showcase__thumbnail .tags-container ul.tags>li>.tag-item');
  rl.close();
});

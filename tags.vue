<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vue Crawler</title>
</head>
<body>

<div id="app">
  <div>
    <label for="mainInput">Enter the main link or keyword to crawl:</label>
    <input v-model="mainInput" id="mainInput" />
    <button @click="getCrawledData">Crawl</button>
  </div>

  <div v-if="crawledData">
    <div v-if="crawledData.mainTags.length">
      <h3>Best 3 Tags from Each Images (1st Page) - {{ crawledData.mainUrl }}:</h3>
      <p>{{ crawledData.mainTags.join(', ') }}</p>
      <hr />
    </div>

    <h3>Tags from All Slider Tags:</h3>
    <p>{{ crawledData.uniqueTags.join(', ') }}</p>
    <hr />

    <h3>All Unique Tags (after removing duplicates):</h3>
    <p>{{ crawledData.allUniqueTags.join(', ') }}</p>
    <hr />
  </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/vue@2"></script>
<script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>

<script>
new Vue({
  el: '#app',
  data: {
    mainInput: '',
    crawledData: null,
  },
  methods: {
    async getTagsFromUrl(url, tagSelector) {
      try {
        const headers = {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        };

        const response = await axios.get(url, { headers });
        const html = response.data;
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const tags = Array.from(doc.querySelectorAll(tagSelector)).map(element => element.textContent.trim());
        return tags;
      } catch (error) {
        console.error(error);
        return null;
      }
    },

    async getCrawledData() {
      try {
        const parsedUrl = new URL(this.mainInput);
        const mainUrl = parsedUrl.protocol && parsedUrl.hostname ? this.mainInput : `https://www.freepik.com/free-photos-vectors/${this.mainInput.replace(' ', '-')}`;

        const headers = {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        };

        const mainResponse = await axios.get(mainUrl, { headers });
        const mainTags = await this.getTagsFromUrl(mainUrl, '.showcase .showcase__item.showcase__item--buttons .showcase__thumbnail .tags-container ul.tags>li>.tag-item');

        const uniqueTags = new Set(mainTags);

        const links = Array.from(doc.querySelectorAll('body.new-resource-list .filter-tags-row .tag-slider--list li a, body.new-resource-list .no-results--popular .tag-slider--list li a'))
          .map(element => new URL(element.href, mainUrl).href);

        for (const link of links) {
          const tags = await this.getTagsFromUrl(link, '.showcase .showcase__item.showcase__item--buttons .showcase__thumbnail .tags-container ul.tags>li>.tag-item');
          if (tags) {
            tags.forEach(tag => uniqueTags.add(tag));
            await new Promise(resolve => setTimeout(resolve, 1000)); // Add a 1-second delay between requests to avoid being blocked
          }
        }

        this.crawledData = {
          mainUrl,
          mainTags,
          uniqueTags: [...uniqueTags],
          allUniqueTags: [...uniqueTags],
        };
      } catch (error) {
        console.error(error);
      }
    }
  }
});
</script>

</body>
</html>

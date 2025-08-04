const htmlmin = require("html-minifier");
const CleanCSS = require("clean-css");
const markdownIt = require("markdown-it");
const markdownItAnchor = require("markdown-it-anchor");
const pluginToc = require("eleventy-plugin-toc");

module.exports = async function (eleventyConfig) {
  const { HtmlBasePlugin } = await import("@11ty/eleventy");

  eleventyConfig.addGlobalData("siteTitle", "OpenFL Tutorials");
  eleventyConfig.addGlobalData("layout", "article.html");
  eleventyConfig.addPassthroughCopy("**/*.png");
  eleventyConfig.addPassthroughCopy("**/*.jpg");
  eleventyConfig.addPassthroughCopy("**/*.gif");
  eleventyConfig.addPlugin(pluginToc);
  eleventyConfig.addPlugin(HtmlBasePlugin);
  eleventyConfig.setLibrary(
    "md",
    markdownIt({ html: true }).use(markdownItAnchor)
  );
  // for debugging purposes
  eleventyConfig.addFilter("log_value", (value) => {
    console.log(value, typeof value);
    return value;
  });
  eleventyConfig.addFilter("extract_title", /** @param content {string} */ (content) => {
    const match = content.match(/<h1[^>]*>(.*?)<\/h1>/i);
    return match ? match[1] : "";
  });
  eleventyConfig.addFilter("omit_title", /** @param content {string} */ (content) => {
    const match = content.match(/<h1[^>]*>.*?<\/h1>/i);
    return match ? content.substring(match[0].length) : content;
  });
  eleventyConfig.addTemplateFormats("css");
  eleventyConfig.addExtension("css", {
    outputFileExtension: "css",
    compile: /** @param content {string} */ async function (content) {
      return async () => {
        return new CleanCSS({}).minify(content).styles;
      };
    },
  });
  eleventyConfig.addTransform("rewritedotmd", /** @param content {string} */ function (content) {
    if (
      this.inputPath &&
      this.inputPath.endsWith(".md") &&
      this.outputPath &&
      this.outputPath.endsWith(".html")
    ) {
    const pathPrefix = module.exports.config?.pathPrefix ?? "/";
      const firstLastIndex = this.inputPath.endsWith("/index.md") ? this.url.length : this.url.lastIndexOf("/");
      const lastSlashIndex = this.url.lastIndexOf(
        "/",
        firstLastIndex - 1
      );
      const startURL = pathPrefix + this.url.substring(1, lastSlashIndex + 1);
      const lastLastSlashIndex = this.url.lastIndexOf(
        "/",
        lastSlashIndex - 1
      );
      const startURLParent =
        lastLastSlashIndex !== -1
          ? pathPrefix + this.url.substring(1, lastLastSlashIndex + 1)
          : startURL;
    console.warn(startURL);
    console.warn(startURLParent);
      return content
        // doesn't start with ./ or ../
        .replace(
          /<a( class="[\w\-]+")? href="(\w[\w\-\/]+)\.md(#[\w+\-]+)?"/g,
          `<a$1 href="${startURL}$2/$3"`
        )
        .replace(
          /<img( class="[\w\-]+")? src="(\w[\w\-\/]+)\.(png|jpg|jpeg|gif|webp|svg)"/g,
          `<img$1 src="${startURL}$2.$3"`
        )
        // starts with ./
        .replace(
          /<a( class="[\w\-]+")? href="\.\/(\w[\w\-\/]+)\.md(#[\w+\-]+)?"/g,
          `<a$1 href="${startURL}$2/$3"`
        )
        .replace(
          /<img( class="[\w\-]+")? src="\.\/(\w[\w\-\/]+)\.(png|jpg|jpeg|gif|webp|svg)"/g,
          `<img$1 src="${startURL}$2.$3"`
        )
        // starts with ../
        .replace(
          /<a( class="[\w\-]+")? href="\.\.\/(\w[\w\-\/]+)\.md(#[\w+\-]+)?"/g,
          `<a$1 href="${startURLParent}$2/$3"`
        )
        .replace(
          /<img( class="[\w\-]+")? src="\.\.\/(\w[\w\-\/]+)\.(png|jpg|jpeg|gif|webp|svg)"/g,
          `<img$1 src="${startURLParent}$2.$3"`
        )
        .replace("/index/", "/");
    }
    return content;
  });
  eleventyConfig.addTransform("htmlmin", /** @param content {string} */ function (content) {
    if (this.outputPath && this.outputPath.endsWith(".html")) {
      return htmlmin.minify(content, {
        useShortDoctype: true,
        removeComments: true,
        collapseWhitespace: true,
        minifyJS: true,
        minifyCSS: true,
      });
    }
    return content;
  });
};

module.exports.config = {
	pathPrefix: "/openfl-adc-tutorials/",
}

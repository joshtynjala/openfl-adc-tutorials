const htmlmin = require("html-minifier");
const CleanCSS = require("clean-css");
const markdownIt = require("markdown-it");
const markdownItAnchor = require("markdown-it-anchor");
const pluginToc = require("eleventy-plugin-toc");

module.exports = function (eleventyConfig) {
  eleventyConfig.addGlobalData("baseURL", "https://joshtynjala.github.io/openfl-adc-tutorials/");
  eleventyConfig.addGlobalData("siteTitle", "OpenFL Tutorials");
  eleventyConfig.addGlobalData("layout", "article.html");
  eleventyConfig.addPassthroughCopy("**/*.png");
  eleventyConfig.addPassthroughCopy("**/*.jpg");
  eleventyConfig.addPassthroughCopy("**/*.gif");
  eleventyConfig.addPassthroughCopy({
    // "static/img": "img",
    // "static/fnt": "fnt",
    // "static/js": "js",
  });
  eleventyConfig.addPlugin(pluginToc);
  eleventyConfig.setLibrary(
    "md",
    markdownIt({ html: true }).use(markdownItAnchor)
  );
  // for debugging purposes
  eleventyConfig.addFilter("log_value", (value) => {
    console.log(value, typeof value);
    return value;
  });
  eleventyConfig.addFilter("extract_title", (content) => {
    const match = content.match(/<h1[^>]*>(.*?)<\/h1>/i);
    return match ? match[1] : "";
  });
  eleventyConfig.addFilter("omit_title", (content) => {
    const match = content.match(/<h1[^>]*>.*?<\/h1>/i);
    return match ? content.substring(match[0].length) : content;
  });
  eleventyConfig.addTemplateFormats("css");
  eleventyConfig.addExtension("css", {
    outputFileExtension: "css",
    compile: async function (content) {
      return async () => {
        return new CleanCSS({}).minify(content).styles;
      };
    },
  });
  eleventyConfig.addTransform("rewritedotmd", function (content) {
    if (
      this.inputPath &&
      this.inputPath.startsWith("./") &&
      this.inputPath.endsWith(".md") &&
      this.outputPath &&
      this.outputPath.endsWith(".html")
    ) {
      const lastSlashIndex = this.inputPath.lastIndexOf("/");
      const startURL = this.inputPath.substring(1, lastSlashIndex + 1);
      const lastLastSlashIndex = this.inputPath.lastIndexOf(
        "/",
        lastSlashIndex - 1
      );
      const startURLParent =
        lastLastSlashIndex !== -1
          ? this.inputPath.substring(1, lastLastSlashIndex + 1)
          : startURL;
      return content
        .replace(
          /<a( class="[\w\-]+")? href="\.\/([\w\-\/]+)\.md(#[\w+\-]+)?"/g,
          `<a$1 href="${startURL}$2/$3"`
        )
        .replace(
          /<a( class="[\w\-]+")? href="\.\.\/([\w\-\/]+)\.md(#[\w+\-]+)?"/g,
          `<a$1 href="${startURLParent}$2/$3"`
        )
        .replace(
          /<img( class="[\w\-]+")? src="\.\/([\w\-\/]+)\.(png|jpg|jpeg|gif|webp|svg)"/g,
          `<img$1 src="${startURL}$2.$3"`
        )
        .replace(
          /<img( class="[\w\-]+")? src="\.\.\/([\w\-\/]+)\.(png|jpg|jpeg|gif|webp|svg)"/g,
          `<img$1 src="${startURLParent}$2.$3"`
        )
        .replace("/index/", "/");
    }
    return content;
  });
  eleventyConfig.addTransform("htmlmin", function (content) {
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

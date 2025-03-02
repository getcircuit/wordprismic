import cheerio from "cheerio";
import { exec } from "child_process";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function stripHTML(html) {
  return cheerio.load(html, { decodeEntities: true }).text();
}

export async function htmlParser(html) {
  const $ = cheerio.load(html, { decodeEntities: true });
  let fixedHtml;

  $("blockquote")
    .children("h1, h2, h3, h4, h5, h6")
    .each((i, el) => {
      return $(el).replaceWith($(el).text());
    });

  // $("span").each((i, el) => {
  //   return $(el).replaceWith($(el).text());
  // });

  fixedHtml = $.html("body").replace(/<body>|<\/body>/g, "");

  return await new Promise((resolve, reject) => {
    exec(
      `ruby ${__dirname}/../kramdown-prismic/lib/kramdown-prismic.rb ${JSON.stringify(
        fixedHtml
          .replace(/\r?\n|\r/g, "")
          .replace(/\u00A0/g, "&nbsp;")
          .replace(/<strong> /g, "<strong>&nbsp;")
          .replace(/ <\/strong>/g, "&nbsp;</strong>")
          .replace(/<em> /g, "<em>&nbsp;")
          .replace(/ <\/em>/g, "&nbsp;</em>")
          .replace(/\$/g, "&#36;")
      )}`,
      (err, stdout) => {
        err && reject(err);
        resolve(JSON.parse(stdout));
      }
    );
  });
}

export function formatDate(date) {
  const d = new Date(date);

  return d.toISOString().split("T")[0];
}

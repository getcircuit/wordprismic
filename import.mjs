import fetch from "node-fetch";
import path from "path";
import fs from "fs";
import uuid from "uuid/v4.js";
import cheerio from "cheerio";
import { exec } from "child_process";
import { fileURLToPath } from "url";
import { dirname } from "path";

import {
  getAuthorIdFromSlug,
  getCategoryIdFromSlug,
} from "./relationshipMaps.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const OUTPUT_FOLDER = "articles";
const OUTPUT_PATH = path.join(process.cwd(), `${OUTPUT_FOLDER}`);

const go = async () => {
  const response = await fetch(
    "https://circuitblog.kinsta.cloud/index.php?graphql",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `
          query getLatestPosts {
            posts(first: 30) {
              nodes {
                date
                modified
                slug
                title
                excerpt
                content
                featuredImage {
                  node {
                    sourceUrl
                    mediaDetails {
                      height
                      width
                    }
                  }
                }
                categories(first: 3) {
                  nodes {
                    name
                    slug    
                    parent {
                      node {
                        name
                      }
                    }
                  }
                }
                author {
                  node {
                    description
                    name
                    slug
                    avatar {
                      url
                    }
                  }
                }
              }
            }
          }
        `,
      }),
    }
  );

  const { data } = await response.json();

  const json = await Promise.all(
    data.posts.nodes.map(async (post) => {
      const authorId = getAuthorIdFromSlug(post.author.node.slug);
      const categoryId = getCategoryIdFromSlug(post.slug);
      const product = getProductByCat(
        post.categories.nodes[0].parent.node.name
      );
      const excerpt = await htmlParser(post.excerpt ?? "");
      const content = await htmlParser(post.content ?? "");

      if (authorId == null) {
        console.error(`${post.slug} is not mapped to an existing author`);
      }
      if (categoryId == null) {
        console.error(`${post.slug} is not mapped to a category`);
        return false;
      }
      if (product == null) {
        console.error(
          `${post.slug} doesn't have a valid product assigned to it`
        );
      }

      return {
        // last_publication_date: "2022-02-17T20:48:16+0000",
        // first_publication_date: "2022-02-12T20:48:16+0000",
        slug: post.slug,
        time_to_read: "time to read",
        title: post.title,
        abstract: [],
        author: authorId
          ? {
              id: `${authorId}`,
              wioUrl: `wio://documents/${authorId}`,
            }
          : undefined,
        product: product,
        description: excerpt,
        featured_image: {
          origin: {
            id: "",
            url: post.featuredImage.node.sourceUrl,
            width: post.featuredImage.node.mediaDetails.width,
            height: post.featuredImage.node.mediaDetails.height,
          },
        },
        body: [
          {
            key: "rich_text$e9ede6f0-d3b6-404c-96be-a694d70c776c",
            value: {
              variation: "default-slice",
              items: [{}],
              primary: content,
            },
          },
        ],
        no_index: false,
        meta: [{ title1: post.title, description1: stripHTML(post.excerpt) }],
        social: [
          {
            image: {
              origin: {
                id: "",
                url: post.featuredImage.node.sourceUrl,
                width: post.featuredImage.node.mediaDetails.width,
                height: post.featuredImage.node.mediaDetails.height,
              },
            },
            title1: post.title,
            description1: stripHTML(post.excerpt),
          },
        ],
        primary_category: categoryId
          ? {
              id: `${categoryId}`,
              wioUrl: `wio://documents/${categoryId}`,
            }
          : undefined,
        type: "article",
        tags: [],
        lang: "en-us",
        grouplang: "Yg6MwBEAACMAd_Ea",
      };
    })
  );

  // const data = [];

  json.filter(Boolean).forEach(
    (post) =>
      new Promise((resolve, reject) => {
        fs.writeFile(
          `/${OUTPUT_PATH}/new_${uuid()}.json`,
          JSON.stringify(post, null, 2),
          (err) => {
            err && reject(err);
            resolve();
          }
        );
      })
  );
};

go();

function getProductByCat(cat) {
  switch (cat) {
    case "Route Planner":
      return "route-planner";
    case "Teams":
      return "teams";

    default:
      return undefined;
  }
}

function stripHTML(html) {
  return cheerio.load(html, { decodeEntities: true }).text();
}

async function htmlParser(html) {
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
      `ruby ${__dirname}/lib/htmlParser.rb ${JSON.stringify(
        fixedHtml.replace(/\r?\n|\r/g, "")
      )}`,
      (err, stdout) => {
        err && reject(err);
        resolve(JSON.parse(stdout));
      }
    );
  });
}

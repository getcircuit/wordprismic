import path from "path";
import fs from "fs";

import {
  getAuthorIdFromSlug,
  getCategoryIdFromSlug,
  getProductByCat,
} from "./lib/relationshipMaps.mjs";

import { stripHTML, htmlParser, formatDate } from "./lib/utils.mjs";
import getAllPosts from "./lib/getAllPosts.mjs";

const OUTPUT_FOLDER = "articles";
const OUTPUT_PATH = path.join(process.cwd(), `${OUTPUT_FOLDER}`);

const go = async () => {
  const allPosts = await getAllPosts();

  const json = await Promise.all(
    allPosts.map(async (post) => {
      const authorId = getAuthorIdFromSlug(post.author.node.slug);
      const categoryId = getCategoryIdFromSlug(post.slug);
      const product = getProductByCat(
        post.categories.nodes[0].parent.node.name
      );
      const content = await htmlParser(post.content ?? "");

      if (authorId == null) {
        console.error(`${post.slug} is not mapped to an existing author`);
      }
      if (categoryId == null) {
        console.error(
          `${post.categories.nodes[0].parent.node.name} | ${post.categories.nodes[0].name} | ${post.slug} `
        );
        return false;
      }
      if (product == null) {
        console.error(
          `${post.slug} doesn't have a valid product assigned to it`
        );
      }

      return {
        legacy_created_at: formatDate(post.first_publicaton_date),
        legacy_updated_at: formatDate(post.last_publication_date),
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
        description: stripHTML(post.excerpt),
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
              primary: {
                content,
              },
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

  json.filter(Boolean).forEach(
    (post) =>
      new Promise((resolve, reject) => {
        // HTML file write for debug reasons
        // fs.writeFile(
        //   `/${OUTPUT_PATH}/${post.slug}.html`,
        //   post.content,
        //   (err) => {
        //     err && reject(err);
        //     resolve();
        //   }
        // );
        fs.writeFile(
          `/${OUTPUT_PATH}/${post.slug}.json`,
          JSON.stringify(post, null, 2).replace(/\u00A0/g, " "),
          (err) => {
            err && reject(err);
            resolve();
          }
        );
      })
  );
};

go();

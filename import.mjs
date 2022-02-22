import fetch from "node-fetch";
import path from "path";
import fs from "fs";
import uuid from "uuid/v4.js";

import {
  getAuthorIdFromSlug,
  getCategoryIdFromSlug,
  getProductByCat,
} from "./lib/relationshipMaps.mjs";

import getPostBySlug from "./lib/queries/getPostBySlug.mjs";
import { stripHTML, htmlParser } from "./lib/utils.mjs";

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
        query: getPostBySlug("how-to-become-an-independent-courier-contractor"),
      }),
    }
  );

  const { data } = await response.json();

  const json = await Promise.all(
    [data].map(async ({ post }) => {
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

  // log will go here
  json.filter(Boolean).forEach(
    (post) =>
      new Promise((resolve, reject) => {
        fs.writeFile(
          `/${OUTPUT_PATH}/${data.post.slug}.html`,
          data.post.content,
          (err) => {
            err && reject(err);
            resolve();
          }
        );
        fs.writeFile(
          `/${OUTPUT_PATH}/${data.post.slug}.json`,
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

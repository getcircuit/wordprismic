import fetch from "node-fetch";

export default async function getAllPosts() {
  let posts = [];

  async function fetchPostsPage(cursor) {
    const response = await fetch(
      "https://circuitblog.kinsta.cloud/index.php?graphql",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: getPostPage(cursor),
        }),
      }
    );

    const {
      data: {
        posts: { pageInfo, nodes },
      },
    } = await response.json();

    posts = [...posts, ...nodes];

    if (pageInfo.hasNextPage) {
      await fetchPostsPage(pageInfo.endCursor);
    } else {
      return posts;
    }
  }

  await fetchPostsPage();

  return posts;
}

function getPostPage(cursor) {
  console.log(cursor);

  return `
  query getPageOfPosts {
    posts(first: 100${cursor ? `, after: "${cursor}"` : ""}) {
        pageInfo {
          hasNextPage
          endCursor
        }
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
    }`;
}

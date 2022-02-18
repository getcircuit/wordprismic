module.exports = {
  wordpress: {
    url: "https://wordpress.getcircuit.com",
  },
  prismic: {
    repo: "getcircuit",
    locale: "en-us",
  },
  optimizeMediaRequests: false,
  schema: async function (post, html) {
    return {
      type: "post",
      uid: post.slug,
      // category: {
      //   id: post.categories[0].prismic.id,
      //   mask: "category",
      // },
      author: post.author?.name ?? "???",
      title: html.decode(post.title.rendered),
      featured_image: {
        origin: {
          url: post.featured_media?.guid?.rendered ?? "???",
        },
        alt: post.featured_media?.alt_text ?? "???",
      },
      excerpt: await html.parse(post.excerpt.rendered),
      content: await html.parse(post.content.rendered),
    };
  },
};

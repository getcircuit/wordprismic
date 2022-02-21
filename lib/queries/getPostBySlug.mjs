export default (slug) => `
query getPostBySlug {
  post(idType: SLUG, id: "${slug}") {
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
`;

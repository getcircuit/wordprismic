export default `
query getLatestPosts {
  posts(first: 56) {
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
`;

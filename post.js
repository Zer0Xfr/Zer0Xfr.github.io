document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const postTitle = urlParams.get('title');

  fetch('posts.json')
    .then(response => response.json())
    .then(posts => {
      const post = posts.find(p => p.title === postTitle);

      if (!post) {
        document.body.innerHTML = '<p>Post not found!</p>';
        return;
      }

      document.getElementById('post-title').textContent = post.title;
      document.getElementById('post-date').textContent = post.date;

      // Fetch the Markdown content from the file
      fetch(post.contentFile)
        .then(response => response.text())
        .then(markdown => {
          const postContent = document.getElementById('post-content');
          postContent.innerHTML = marked.parse(markdown); // Render Markdown
        })
        .catch(err => {
          document.getElementById('post-content').innerHTML = `<p>Error loading post content: ${err.message}</p>`;
        });
    })
    .catch(err => {
      document.body.innerHTML = `<p>Error loading posts: ${err.message}</p>`;
    });
});

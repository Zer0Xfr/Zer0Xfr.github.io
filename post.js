// Configure Marked.js to use Prism.js for code highlighting
marked.setOptions({
  baseUrL: './',
  highlight: function (code, lang) {
    if (Prism.languages[lang]) {
      return Prism.highlight(code, Prism.languages[lang], lang);
    } else {
      return code; // Fallback for unsupported languages
    }
  }
});

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

      // Fetch the Markdown file
      fetch(post.contentFile)
        .then(response => response.text())
        .then(markdown => {
          const postContent = document.getElementById('post-content');
          postContent.innerHTML = marked.parse(markdown); // Render Markdown

          // Apply syntax highlighting with Prism.js
          Prism.highlightAll();
        })
        .catch(err => {
          document.getElementById('post-content').innerHTML = `<p>Error loading post content: ${err.message}</p>`;
        });
    })
    .catch(err => {
      document.body.innerHTML = `<p>Error loading posts: ${err.message}</p>`;
    });
});


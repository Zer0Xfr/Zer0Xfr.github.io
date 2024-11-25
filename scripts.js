document.addEventListener('DOMContentLoaded', () => {
    const postsContainer = document.getElementById('posts-container');
  
    fetch('posts.json')
      .then(response => response.json())
      .then(posts => {
        postsContainer.innerHTML = ''; // Clear the loading message
  
        posts.forEach(post => {
          const postCard = document.createElement('div');
          postCard.className = 'post-card';
  
          postCard.innerHTML = `
            <img src="${post.image}" alt="${post.title}" class="post-image">
            <h2>${post.title}</h2>
            <p>${post.description}</p>
            <a href="post.html?title=${encodeURIComponent(post.title)}">Read More</a>
          `;
  
          postsContainer.appendChild(postCard);
        });
      })
      .catch(err => {
        postsContainer.innerHTML = `<p>Error loading posts: ${err.message}</p>`;
      });
  });
  
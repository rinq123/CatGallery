// Grab DOM elements
const loadBtn = document.querySelector('#load-btn');
const favBtn = document.querySelector('#fav-btn');
const toggleDarkBtn = document.querySelector('#toggle-dark-btn');
const cardContainer = document.querySelector('.card-container');
const spinner = document.querySelector('#spinner');
const lightbox    = document.querySelector('#lightbox');
const lightboxImg = document.querySelector('#lightbox-img');
const closeBtn    = document.querySelector('.modal-close');
const prevBtn     = document.querySelector('.modal-nav.prev');
const nextBtn     = document.querySelector('.modal-nav.next');
const modalFavBtn = document.querySelector('#modal-fav-btn');
const sentinel = document.querySelector('#scroll-sentinel');
const breedSelect = document.querySelector('#breed-select');
const filterForm = document.getElementById('filter-form');
const searchInput = document.getElementById('search-input');
const modalDownloadBtn = document.querySelector('#modal-download-btn');

// Track the current page for infinite scroll
let currentPage = 0;
let viewingFavorites = false; // Track if we're viewing favorites

// Keep track of the current index and image URLs
let currentIndex = 0;
let currentImages = [];


console.log({ loadBtn, favBtn, toggleDarkBtn, cardContainer, spinner, lightbox, lightboxImg, closeBtn, prevBtn, nextBtn, modalFavBtn }); 
// If any of these is null, your HTML IDs/classes are mismatched.

// Helpers
const API_URL = 'https://api.thecatapi.com/v1/images/search?limit=6';
function getFavorites() {
  return JSON.parse(localStorage.getItem('catFavorites') || '[]');
}
function setFavorites(arr) {
  localStorage.setItem('catFavorites', JSON.stringify(arr));
}
function isFavorited(url) {
  return getFavorites().includes(url);
}

// Fetch + render
async function fetchCats(showFavorites = false, append = false) {
  // On Fresh load (not append), reset page and container
  if (!append) {
    currentPage = 0;
    currentImages = [];
    cardContainer.innerHTML = '';
  };
  // SHOW spinner 
  spinner.style.display = 'block';

  try {
    let cats;
    if (showFavorites) {
      cats = getFavorites().map(url => ({ url }));
    } else {
      // Increment page for infinite scroll
      currentPage++;
      const resp = await fetch(API_URL);
      cats = await resp.json();
    }
    renderCats(cats, append);
  } catch (err) {
    console.error(err);
  } finally {
    // HIDE spinner no matter what
    spinner.style.display = 'none';
  }
}




function renderCats(cats, append = false) {
  // If appending, add to currentImages; otherwise, reset
  let startIndex;
  if (append) {
    startIndex = currentImages.length;
    currentImages.push(...cats.map(cat => cat.url));
  } else {
    startIndex = 0;
    currentImages = cats.map(cat => cat.url);
  }

  cats.forEach((cat, idx) => {
    const imageIndex = startIndex + idx; // Absolute index in currentImages

    const card = document.createElement('div');
    card.className = 'card';

    const img = document.createElement('img');
    img.src = cat.url;
    img.alt = 'Cute cat';
    img.style.cursor = 'pointer';
    img.onclick = () => openLightbox(imageIndex);

    const btn = document.createElement('button');
    btn.textContent = isFavorited(cat.url) ? '❤️' : '🤍';
    btn.onclick = () => {
      toggleFavorite(cat.url);
      btn.textContent = isFavorited(cat.url) ? '❤️' : '🤍';
      btn.classList.add('pop');
      btn.addEventListener('transitionend', e => {
        if (e.propertyName === 'transform') {
          btn.classList.remove('pop');
        }
      }, { once: true });
    };

    card.append(img, btn);
    cardContainer.appendChild(card);
  });
}

// Favorites logic
function toggleFavorite(url) {
  let favs = getFavorites();
  if (isFavorited(url)) {
    favs = favs.filter(x => x !== url);
  } else {
    favs.push(url);
  }
  setFavorites(favs);
}

// Dark mode
toggleDarkBtn.onclick = () => {
  document.body.classList.toggle('dark-mode');
  localStorage.setItem(
    'darkMode',
    document.body.classList.contains('dark-mode')
  );
};
if (localStorage.getItem('darkMode') === 'true') {
  document.body.classList.add('dark-mode');
}

// Show the lightbox at a given index
function openLightbox(index) {
  currentIndex = index;
  const url = currentImages[index];
  lightboxImg.src = url;
   // Update modal heart
  modalFavBtn.textContent = isFavorited(url) ? '❤️' : '🤍';

  lightbox.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden'; // prevent background scroll
  
  showRandomCatFact(); // Show a random cat fact when opening lightbox
}

// Close the overlay
function closeLightbox() {
  lightbox.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

// Navigate to previous/next
function showPrev() {
  currentIndex = (currentIndex - 1 + currentImages.length) % currentImages.length;
  lightboxImg.src = currentImages[currentIndex];
}

function showNext() {
  currentIndex = (currentIndex + 1) % currentImages.length;
  lightboxImg.src = currentImages[currentIndex];
}

function showToast(message) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  container.appendChild(toast);

  // Trigger the CSS transition
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  // Hide + cleanup after 2s
  setTimeout(() => {
    toast.classList.remove('show');
    toast.addEventListener('transitionend', () => {
      toast.remove();
    }, { once: true });
  }, 2000);
}

// Close on overlay click (but not on inner content)
lightbox.onclick = e => {
  if (e.target === lightbox) closeLightbox();
};

// Keyboard navigation
document.addEventListener('keydown', e => {
  if (lightbox.getAttribute('aria-hidden') === 'false') {
    if (e.key === 'ArrowLeft')  showPrev();
    if (e.key === 'ArrowRight') showNext();
    if (e.key === 'Escape')     closeLightbox();
  }
});


modalFavBtn.onclick = () => {
  const url = currentImages[currentIndex];
  toggleFavorite(url);

  // Update icon
  const nowFav = isFavorited(url);
  modalFavBtn.textContent = nowFav ? '❤️' : '🤍';

  // Animate
  modalFavBtn.classList.add('pop');
  modalFavBtn.addEventListener('transitionend', e => {
    if (e.propertyName === 'transform') {
      modalFavBtn.classList.remove('pop');
    }
  }, { once: true });

  // Show toast
  const msg = nowFav
    ? 'Added to favorites!'
    : 'Removed from favorites!';
  showToast(msg);
};


// Sentinel for infinite scroll
const observer = new IntersectionObserver(entries => {
  if (entries[0].isIntersecting && !viewingFavorites) { // Only fetch more if not viewing favorites
    fetchCats(false, true); // Fetch more cats on scroll
  }
},{
  root: null, // Use viewport as root
  rootMargin: '200px', // Trigger when 200px from bottom
  threshold: 0 // Trigger when 10% of sentinel is visible
});
observer.observe(sentinel);


async function showRandomCatFact() {
  const factPanel = document.getElementById('cat-fact');
  factPanel.textContent = 'Loading cat fact...';
  try {
    const resp = await fetch('https://catfact.ninja/fact');
    const data = await resp.json();
    factPanel.textContent = data.fact;
  } catch {
    factPanel.textContent = 'Could not load a cat fact right now!';
  }
}


// Events Listeners
loadBtn.onclick = () => {
  viewingFavorites = false;
  fetchCats(false);
}
favBtn.onclick = () => {
  viewingFavorites = true;
  fetchCats(true);
}

document.addEventListener('DOMContentLoaded', () => fetchCats(false));
closeBtn.onclick = closeLightbox;
prevBtn.onclick  = showPrev;
nextBtn.onclick  = showNext;

modalDownloadBtn.onclick = () => {
  const url = currentImages[currentIndex];
  window.open(url, '_blank'); // Open in new tab
}
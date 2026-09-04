const state = {
  cities: [],
  reviews: [],
  activeTag: "All",
  searchTerm: "",
  sortBy: "rating"
};

const grid = document.getElementById("cityGrid");
const loadingState = document.getElementById("loadingState");
const errorState = document.getElementById("errorState");
const emptyState = document.getElementById("emptyState");
const resultCount = document.getElementById("resultCount");
const tagFilters = document.getElementById("tagFilters");
const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");
const modalOverlay = document.getElementById("modalOverlay");
const modalBody = document.getElementById("modalBody");
const modalClose = document.getElementById("modalClose");

function fetchCities() {
  return fetch("data/cities.json").then(function (response) {
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    return response.json();
  });
}

function fetchReviews() {
  return new Promise(function (resolve, reject) {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", "data/reviews.xml", true);
    xhr.onload = function () {
      if (xhr.status >= 200 && xhr.status < 300 && xhr.responseXML) {
        const nodes = xhr.responseXML.getElementsByTagName("review");
        const parsed = [];
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];
          parsed.push({
            cityId: Number(node.getElementsByTagName("cityId")[0].textContent),
            author: node.getElementsByTagName("author")[0].textContent,
            rating: Number(node.getElementsByTagName("rating")[0].textContent),
            comment: node.getElementsByTagName("comment")[0].textContent
          });
        }
        resolve(parsed);
      } else {
        reject(new Error("Failed to load or parse XML"));
      }
    };
    xhr.onerror = function () {
      reject(new Error("XHR request failed"));
    };
    xhr.send();
  });
}

function buildTagFilters(cities) {
  const tagSet = new Set();
  cities.forEach(function (city) {
    city.tags.forEach(function (tag) {
      tagSet.add(tag);
    });
  });
  const tags = ["All"].concat(Array.from(tagSet).sort());
  tagFilters.innerHTML = "";
  tags.forEach(function (tag) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tag-btn" + (tag === state.activeTag ? " active" : "");
    btn.textContent = tag;
    btn.addEventListener("click", function () {
      state.activeTag = tag;
      document.querySelectorAll(".tag-btn").forEach(function (b) {
        b.classList.remove("active");
      });
      btn.classList.add("active");
      render();
    });
    tagFilters.appendChild(btn);
  });
}

function getFilteredCities() {
  let list = state.cities.slice();

  if (state.activeTag !== "All") {
    list = list.filter(function (city) {
      return city.tags.indexOf(state.activeTag) !== -1;
    });
  }

  if (state.searchTerm.trim() !== "") {
    const term = state.searchTerm.trim().toLowerCase();
    list = list.filter(function (city) {
      return (
        city.name.toLowerCase().indexOf(term) !== -1 ||
        city.country.toLowerCase().indexOf(term) !== -1 ||
        city.tagline.toLowerCase().indexOf(term) !== -1
      );
    });
  }

  if (state.sortBy === "rating") {
    list.sort(function (a, b) {
      return b.rating - a.rating;
    });
  } else if (state.sortBy === "name") {
    list.sort(function (a, b) {
      return a.name.localeCompare(b.name);
    });
  }

  return list;
}

function createCityCard(city) {
  const card = document.createElement("article");
  card.className = "city-card";

  const banner = document.createElement("div");
  banner.className = "card-banner";
  banner.style.background = city.color;
  banner.textContent = city.flag;

  const content = document.createElement("div");
  content.className = "card-content";

  const title = document.createElement("h3");
  title.className = "card-title";
  title.textContent = city.name;

  const country = document.createElement("p");
  country.className = "card-country";
  country.textContent = city.country;

  const tagline = document.createElement("p");
  tagline.className = "card-tagline";
  tagline.textContent = city.tagline;

  const footer = document.createElement("div");
  footer.className = "card-footer";

  const tagsWrap = document.createElement("div");
  tagsWrap.className = "card-tags";
  city.tags.forEach(function (tag) {
    const span = document.createElement("span");
    span.className = "mini-tag";
    span.textContent = tag;
    tagsWrap.appendChild(span);
  });

  const rating = document.createElement("span");
  rating.className = "card-rating";
  rating.textContent = "★ " + city.rating.toFixed(1);

  footer.appendChild(tagsWrap);
  footer.appendChild(rating);

  content.appendChild(title);
  content.appendChild(country);
  content.appendChild(tagline);
  content.appendChild(footer);

  card.appendChild(banner);
  card.appendChild(content);

  card.addEventListener("click", function () {
    openModal(city);
  });

  return card;
}

function render() {
  const filtered = getFilteredCities();
  grid.innerHTML = "";

  if (filtered.length === 0) {
    emptyState.hidden = false;
  } else {
    emptyState.hidden = true;
    filtered.forEach(function (city) {
      grid.appendChild(createCityCard(city));
    });
  }

  resultCount.textContent = filtered.length + " destination" + (filtered.length === 1 ? "" : "s") + " found";
}

function openModal(city) {
  const cityReviews = state.reviews.filter(function (review) {
    return review.cityId === city.id;
  });

  modalBody.innerHTML = "";

  const header = document.createElement("div");
  header.className = "modal-header";
  header.textContent = city.flag + " " + city.name;

  const countryLine = document.createElement("p");
  countryLine.className = "modal-country";
  countryLine.textContent = city.country;

  const description = document.createElement("p");
  description.textContent = city.description;

  const infoGrid = document.createElement("div");
  infoGrid.className = "modal-info-grid";

  const bestTimeBlock = document.createElement("div");
  bestTimeBlock.className = "info-block";
  bestTimeBlock.innerHTML = '<div class="info-label">Best time to visit</div><div class="info-value">' + city.bestTime + "</div>";

  const budgetBlock = document.createElement("div");
  budgetBlock.className = "info-block";
  budgetBlock.innerHTML = '<div class="info-label">Average budget</div><div class="info-value">' + city.budget + "</div>";

  infoGrid.appendChild(bestTimeBlock);
  infoGrid.appendChild(budgetBlock);

  const reviewsTitle = document.createElement("h4");
  reviewsTitle.className = "modal-section-title";
  reviewsTitle.textContent = "Traveler Reviews (" + cityReviews.length + ")";

  modalBody.appendChild(header);
  modalBody.appendChild(countryLine);
  modalBody.appendChild(description);
  modalBody.appendChild(infoGrid);
  modalBody.appendChild(reviewsTitle);

  if (cityReviews.length === 0) {
    const noReviews = document.createElement("p");
    noReviews.className = "no-reviews";
    noReviews.textContent = "No reviews yet for this destination.";
    modalBody.appendChild(noReviews);
  } else {
    cityReviews.forEach(function (review) {
      const reviewCard = document.createElement("div");
      reviewCard.className = "review-card";

      const top = document.createElement("div");
      top.className = "review-top";

      const author = document.createElement("span");
      author.textContent = review.author;

      const ratingSpan = document.createElement("span");
      ratingSpan.className = "review-rating";
      ratingSpan.textContent = "★ " + review.rating.toFixed(1);

      top.appendChild(author);
      top.appendChild(ratingSpan);

      const comment = document.createElement("p");
      comment.className = "review-comment";
      comment.textContent = review.comment;

      reviewCard.appendChild(top);
      reviewCard.appendChild(comment);
      modalBody.appendChild(reviewCard);
    });
  }

  modalOverlay.hidden = false;
  document.body.style.overflow = "hidden";
  modalClose.focus();
}

function closeModal() {
  modalOverlay.hidden = true;
  document.body.style.overflow = "";
}

modalClose.addEventListener("click", closeModal);
modalOverlay.addEventListener("click", function (event) {
  if (event.target === modalOverlay) {
    closeModal();
  }
});
document.addEventListener("keydown", function (event) {
  if (event.key === "Escape" && !modalOverlay.hidden) {
    closeModal();
  }
});

searchInput.addEventListener("input", function (event) {
  state.searchTerm = event.target.value;
  render();
});

sortSelect.addEventListener("change", function (event) {
  state.sortBy = event.target.value;
  render();
});

Promise.all([fetchCities(), fetchReviews()])
  .then(function (results) {
    state.cities = results[0];
    state.reviews = results[1];
    loadingState.hidden = true;
    buildTagFilters(state.cities);
    render();
  })
  .catch(function () {
    loadingState.hidden = true;
    errorState.hidden = false;
  });

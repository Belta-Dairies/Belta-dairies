// Belta Dairies starter website.
// DEMO ONLY: this password and browser storage are not secure or shared online.
// For a public live admin system, connect a real backend and protected media storage.
const DEMO_ADMIN_PASSWORD = "belta123";

const menuToggle = document.getElementById("menuToggle");
const mainNav = document.getElementById("mainNav");
menuToggle.addEventListener("click", () => {
  const isOpen = mainNav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});
mainNav.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
  mainNav.classList.remove("open");
  menuToggle.setAttribute("aria-expanded", "false");
}));
document.getElementById("year").textContent = new Date().getFullYear();

const loginForm = document.getElementById("adminLoginForm");
const postForm = document.getElementById("postForm");
const loginMessage = document.getElementById("loginMessage");
const postMessage = document.getElementById("postMessage");
const updatesGrid = document.getElementById("updatesGrid");
const emptyUpdates = document.getElementById("emptyUpdates");
const adminPostList = document.getElementById("adminPostList");
const postMediaInput = document.getElementById("postMedia");

let posts = [];
let currentMediaData = "";

try {
  const savedPosts = localStorage.getItem("beltaDairiesPosts");
  if (savedPosts) posts = JSON.parse(savedPosts);
} catch (error) {
  console.warn("Could not load saved Belta posts.", error);
  posts = [];
}

function savePosts() {
  try {
    localStorage.setItem("beltaDairiesPosts", JSON.stringify(posts));
    return true;
  } catch (error) {
    return false;
  }
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[character]);
}

function renderPosts() {
  updatesGrid.querySelectorAll(".user-post").forEach(card => card.remove());
  const sortedPosts = [...posts].sort((a, b) => b.createdAt - a.createdAt);
  emptyUpdates.hidden = sortedPosts.length > 0;
  sortedPosts.forEach(post => {
    const card = document.createElement("article");
    card.className = "update-card user-post";
    const visual = document.createElement("div");
    visual.className = "update-visual";
    visual.textContent = post.type === "video" ? "🎬" : "🥛";
    if (post.mediaData && post.mediaType && post.mediaType.startsWith("video/")) {
      const video = document.createElement("video");
      video.src = post.mediaData;
      video.controls = true;
      video.preload = "metadata";
      video.setAttribute("aria-label", post.title);
      visual.textContent = "";
      visual.appendChild(video);
    } else if (post.mediaData && post.mediaType && post.mediaType.startsWith("image/")) {
      const img = document.createElement("img");
      img.src = post.mediaData;
      img.alt = post.title;
      visual.textContent = "";
      visual.appendChild(img);
    }
    const content = document.createElement("div");
    content.className = "update-content";
    const date = document.createElement("span");
    date.className = "update-date";
    date.textContent = `${post.type === "video" ? "VIDEO" : "SHOP UPDATE"} · ${new Date(post.createdAt).toLocaleDateString()}`;
    const title = document.createElement("h3");
    title.textContent = post.title;
    const description = document.createElement("p");
    description.textContent = post.text;
    content.append(date, title, description);
    card.append(visual, content);
    updatesGrid.prepend(card);
  });
  renderAdminPostList();
}

function renderAdminPostList() {
  adminPostList.replaceChildren();
  if (!posts.length) {
    const message = document.createElement("p");
    message.className = "form-note";
    message.textContent = "No administrator posts yet.";
    adminPostList.appendChild(message);
    return;
  }
  posts.forEach(post => {
    const row = document.createElement("div");
    row.className = "admin-post-row";
    const title = document.createElement("span");
    title.textContent = post.title;
    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "Delete";
    remove.setAttribute("aria-label", `Delete post ${post.title}`);
    remove.addEventListener("click", () => {
      posts = posts.filter(item => item.id !== post.id);
      savePosts();
      renderPosts();
    });
    row.append(title, remove);
    adminPostList.appendChild(row);
  });
}

loginForm.addEventListener("submit", event => {
  event.preventDefault();
  const password = document.getElementById("adminPassword").value;
  if (password === DEMO_ADMIN_PASSWORD) {
    loginForm.hidden = true;
    postForm.hidden = false;
    loginMessage.textContent = "";
    renderAdminPostList();
  } else {
    loginMessage.textContent = "That password is not correct. Please try again.";
  }
});

document.getElementById("logoutButton").addEventListener("click", () => {
  postForm.hidden = true;
  loginForm.hidden = false;
  loginForm.reset();
  postMessage.textContent = "";
});

postMediaInput.addEventListener("change", () => {
  const file = postMediaInput.files && postMediaInput.files[0];
  currentMediaData = "";
  if (!file) return;
  if (!file.type.startsWith("video/") && !file.type.startsWith("image/")) {
    postMessage.textContent = "Please choose a video or image file.";
    postMediaInput.value = "";
    return;
  }
  if (file.size > 15 * 1024 * 1024) {
    postMessage.textContent = "That file is over 15 MB. Choose a smaller file for this demo.";
    postMediaInput.value = "";
    return;
  }
  const reader = new FileReader();
  reader.onload = () => { currentMediaData = String(reader.result || ""); };
  reader.onerror = () => { postMessage.textContent = "Could not read that file. Please try another one."; };
  reader.readAsDataURL(file);
});

postForm.addEventListener("submit", event => {
  event.preventDefault();
  const title = document.getElementById("postTitle").value.trim();
  const text = document.getElementById("postText").value.trim();
  const type = document.getElementById("postType").value;
  if (!title || !text) {
    postMessage.textContent = "Please enter both a title and update details.";
    return;
  }
  const file = postMediaInput.files && postMediaInput.files[0];
  if (file && !currentMediaData) {
    postMessage.textContent = "Your file is still loading. Please wait a moment and publish again.";
    return;
  }
  const newPost = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title,
    text,
    type,
    mediaData: currentMediaData,
    mediaType: file ? file.type : "",
    createdAt: Date.now()
  };
  posts.unshift(newPost);
  if (!savePosts()) {
    posts.shift();
    postMessage.textContent = "Browser storage is full. Try a smaller video or remove old posts.";
    return;
  }
  renderPosts();
  postForm.reset();
  currentMediaData = "";
  postMessage.textContent = "Post added to this browser. It is not yet published to other visitors online.";
});

renderPosts();

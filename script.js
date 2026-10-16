import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged, 
    GoogleAuthProvider, 
    GithubAuthProvider, 
    signInWithRedirect,
    getRedirectResult
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";

import { 
    collection, 
    addDoc, 
    getDocs, 
    doc, 
    updateDoc, 
    deleteDoc, 
    query, 
    where 
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";

const auth = window.auth;
const db = window.db;

const form = document.getElementById("book-form");
const modal = document.getElementById("detail-modal");
const submitBtn = document.getElementById("submit-btn");
const loginOverlay = document.getElementById("login-overlay");

let books = [];
let currentIndex = null;
let editingIndex = null;
let currentUser = null;
let yearlyGoal = 0;

// Handle redirect result (for Google / GitHub)
getRedirectResult(auth)
    .then((result) => {
        if (result && result.user) {
            loginOverlay.classList.add("hidden");
        }
    })
    .catch((error) => {
        console.error(error);
        alert(error.message);
    });

onAuthStateChanged(auth, async (user) => {
    currentUser = user;
    if (user) {
        document.getElementById("login-open-btn").classList.add("hidden");
        document.getElementById("user-info").classList.remove("hidden");
        document.getElementById("user-email").textContent = user.email || user.displayName || "Logged in";
        loginOverlay.classList.add("hidden");
        await loadBooks();
        loadGoal();
    } else {
        document.getElementById("login-open-btn").classList.remove("hidden");
        document.getElementById("user-info").classList.add("hidden");
        books = [];
        renderAllSections();
    }
});

async function loadBooks() {
    if (!currentUser) return;
    const q = query(collection(db, "books"), where("userId", "==", currentUser.uid));
    const snap = await getDocs(q);
    books = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderAllSections();
    updateStats();
}

function getSelectedTags() {
    return Array.from(document.querySelectorAll('input[name="tags"]:checked')).map(cb => cb.value);
}

function setSelectedTags(tags = []) {
    document.querySelectorAll('input[name="tags"]').forEach(cb => {
        cb.checked = tags.includes(cb.value);
    });
}

function createCard(book) {
    const card = document.createElement("div");
    card.className = "book-card";
    const tagsHtml = book.tags && book.tags.length
        ? `<div class="tags">${book.tags.map(t => `<span class="tag">${t}</span>`).join("")}</div>`
        : "";
    card.innerHTML = `
        <strong>${book.title}</strong>
        by ${book.author || "unknown"}<br>
        ${book.genre || ""}<br>
        Rating: ${book.rating || "-"}/5
        ${tagsHtml}
    `;
    card.onclick = () => openDetail(books.findIndex(b => b.id === book.id));
    return card;
}

function renderAllSections() {
    const want = books.filter(b => b.tags && b.tags.includes("Want to Read"));
    const current = books.filter(b => b.tags && b.tags.includes("Currently Reading"));
    const finished = books.filter(b => b.tags && b.tags.includes("Finished"));

    document.getElementById("want-list").innerHTML = "";
    document.getElementById("current-list").innerHTML = "";
    document.getElementById("finished-list").innerHTML = "";
    document.getElementById("all-list").innerHTML = "";

    want.forEach(b => document.getElementById("want-list").appendChild(createCard(b)));
    current.forEach(b => document.getElementById("current-list").appendChild(createCard(b)));
    finished.forEach(b => document.getElementById("finished-list").appendChild(createCard(b)));
    books.forEach(b => document.getElementById("all-list").appendChild(createCard(b)));
}

function openDetail(index) {
    currentIndex = index;
    const b = books[index];
    document.getElementById("detail-title").textContent = b.title;
    document.getElementById("detail-author").textContent = "by " + (b.author || "unknown");
    document.getElementById("detail-genre").textContent = b.genre || "No genre";
    document.getElementById("detail-rating").textContent = "Rating: " + (b.rating || "-") + "/5";
    document.getElementById("detail-tags").textContent = b.tags && b.tags.length ? "Tags: " + b.tags.join(", ") : "No tags";
    document.getElementById("detail-notes").textContent = b.notes || "No notes";
    modal.classList.remove("hidden");
}

function updateStats() {
    document.getElementById("total-books").textContent = books.length;

    const year = new Date().getFullYear();
    const thisYear = books.filter(b => b.dateFinished && new Date(b.dateFinished).getFullYear() === year).length;
    document.getElementById("books-this-year").textContent = thisYear;

    const rated = books.filter(b => b.rating);
    document.getElementById("avg-rating").textContent = rated.length
        ? (rated.reduce((s, b) => s + Number(b.rating), 0) / rated.length).toFixed(1)
        : "-";

    const genres = {};
    books.forEach(b => {
        if (b.genre) genres[b.genre] = (genres[b.genre] || 0) + 1;
    });
    const top = Object.keys(genres).sort((a, b) => genres[b] - genres[a])[0] || "-";
    document.getElementById("top-genre").textContent = top;

    if (yearlyGoal > 0) {
        const pct = Math.min(100, Math.round((thisYear / yearlyGoal) * 100));
        document.getElementById("progress-bar").style.width = pct + "%";
        document.getElementById("goal-text").textContent = `${thisYear} / ${yearlyGoal} (${pct}%)`;
    } else {
        document.getElementById("progress-bar").style.width = "0%";
        document.getElementById("goal-text").textContent = "No goal set";
    }
}

function loadGoal() {
    yearlyGoal = Number(localStorage.getItem("goal_" + currentUser.uid)) || 0;
    document.getElementById("goal-input").value = yearlyGoal || "";
    updateStats();
}

document.getElementById("save-goal").onclick = () => {
    yearlyGoal = Number(document.getElementById("goal-input").value) || 0;
    if (currentUser) localStorage.setItem("goal_" + currentUser.uid, yearlyGoal);
    updateStats();
};

form.onsubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) return alert("Log in first");

    const data = {
        title: document.getElementById("title").value.trim(),
        author: document.getElementById("author").value.trim(),
        genre: document.getElementById("genre").value,
        rating: Number(document.getElementById("rating").value) || null,
        notes: document.getElementById("notes").value.trim(),
        tags: getSelectedTags(),
        dateFinished: document.getElementById("date-finished").value || null,
        userId: currentUser.uid
    };

    if (!data.title) return;

    submitBtn.disabled = true;
    submitBtn.textContent = "Saving...";

    try {
        if (editingIndex !== null) {
            await updateDoc(doc(db, "books", books[editingIndex].id), data);
            books[editingIndex] = { id: books[editingIndex].id, ...data };
            editingIndex = null;
            document.getElementById("form-title").textContent = "Add any book";
        } else {
            const ref = await addDoc(collection(db, "books"), data);
            books.push({ id: ref.id, ...data });
        }

        form.reset();
        setSelectedTags([]);
        renderAllSections();
        updateStats();
    } catch (err) {
        alert("Failed to save: " + err.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = editingIndex !== null ? "Save changes" : "Add to shelf";
    }
};

document.getElementById("delete-book").onclick = async () => {
    if (currentIndex == null) return;
    const deleteBtn = document.getElementById("delete-book");
    deleteBtn.disabled = true;
    deleteBtn.textContent = "Deleting...";

    try {
        await deleteDoc(doc(db, "books", books[currentIndex].id));
        books.splice(currentIndex, 1);
        modal.classList.add("hidden");
        renderAllSections();
        updateStats();
    } catch (err) {
        alert("Failed to delete: " + err.message);
    } finally {
        deleteBtn.disabled = false;
        deleteBtn.textContent = "Delete";
    }
};

document.getElementById("edit-book").onclick = () => {
    const b = books[currentIndex];
    editingIndex = currentIndex;
    document.getElementById("title").value = b.title;
    document.getElementById("author").value = b.author || "";
    document.getElementById("genre").value = b.genre || "";
    document.getElementById("rating").value = b.rating || "";
    document.getElementById("notes").value = b.notes || "";
    document.getElementById("date-finished").value = b.dateFinished || "";
    setSelectedTags(b.tags || []);
    document.getElementById("form-title").textContent = "Edit book";
    document.getElementById("submit-btn").textContent = "Save changes";
    modal.classList.add("hidden");
};

document.getElementById("close-modal").onclick = () => modal.classList.add("hidden");

// Login overlay
const loginOpenBtn = document.getElementById("login-open-btn");
const loginCloseBtn = document.getElementById("login-close-btn");

if (loginOpenBtn && loginOverlay) {
    loginOpenBtn.addEventListener("click", () => {
        loginOverlay.classList.remove("hidden");
    });
}

if (loginCloseBtn && loginOverlay) {
    loginCloseBtn.addEventListener("click", () => {
        loginOverlay.classList.add("hidden");
    });
}

if (loginOverlay) {
    loginOverlay.addEventListener("click", (e) => {
        if (e.target === loginOverlay) {
            loginOverlay.classList.add("hidden");
        }
    });
}

document.getElementById("login-btn").onclick = async () => {
    try {
        await signInWithEmailAndPassword(auth, document.getElementById("email").value, document.getElementById("password").value);
        loginOverlay.classList.add("hidden");
    } catch (e) {
        alert(e.message);
    }
};

document.getElementById("signup-btn").onclick = async () => {
    try {
        await createUserWithEmailAndPassword(auth, document.getElementById("email").value, document.getElementById("password").value);
        loginOverlay.classList.add("hidden");
    } catch (e) {
        alert(e.message);
    }
};

// Google & GitHub using redirect
document.getElementById("google-btn").onclick = () => {
    signInWithRedirect(auth, new GoogleAuthProvider());
};

document.getElementById("github-btn").onclick = () => {
    signInWithRedirect(auth, new GithubAuthProvider());
};

document.getElementById("logout-btn").onclick = () => signOut(auth);
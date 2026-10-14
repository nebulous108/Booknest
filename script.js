import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
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
const bookList = document.getElementById("book-list");
const modal = document.getElementById("detail-modal");
const closeModal = document.getElementById("close-modal");
const deleteBtn = document.getElementById("delete-book");
const editBtn = document.getElementById("edit-book");
const cancelEditBtn = document.getElementById("cancel-edit");
const formTitle = document.getElementById("form-title");
const submitBtn = document.getElementById("submit-btn");
const searchBar = document.getElementById("search-bar");
const searchFilter = document.getElementById("search-filter");
const emptyMessage = document.getElementById("empty-message");

let books = [];
let currentIndex = null;
let editingIndex = null;
let currentUser = null;

// Watch login state
onAuthStateChanged(auth, async (user) => {
    currentUser = user;
    if (user) {
        document.getElementById("login-form").classList.add("hidden");
        document.getElementById("user-info").classList.remove("hidden");
        document.getElementById("user-email").textContent = user.email;
        await loadBooks();
    } else {
        document.getElementById("login-form").classList.remove("hidden");
        document.getElementById("user-info").classList.add("hidden");
        books = [];
        renderBooks();
    }
});

async function loadBooks() {
    if (!currentUser) return;
    const q = query(collection(db, "books"), where("userId", "==", currentUser.uid));
    const snapshot = await getDocs(q);
    books = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
    renderBooks();
}

function getSelectedTags() {
    const checkboxes = document.querySelectorAll('input[name="tags"]:checked');
    return Array.from(checkboxes).map(cb => cb.value);
}

function setSelectedTags(tags = []) {
    document.querySelectorAll('input[name="tags"]').forEach(cb => {
        cb.checked = tags.includes(cb.value);
    });
}

function renderBooks(booksToShow = books) {
    bookList.innerHTML = "";

    if (booksToShow.length === 0) {
        emptyMessage.classList.remove("hidden");
        return;
    }

    emptyMessage.classList.add("hidden");

    booksToShow.forEach((book) => {
        const card = document.createElement("div");
        card.className = "book-card";

        const tagsHtml = book.tags && book.tags.length
            ? `<div class="tags">${book.tags.map(tag => `<span class="tag">${tag}</span>`).join("")}</div>`
            : "";

        card.innerHTML = `
            <strong>${book.title}</strong>
            by ${book.author || "unknown"}<br>
            ${book.genre || "No genre"}<br>
            Rating: ${book.rating || "-"}/5
            ${tagsHtml}
        `;

        const realIndex = books.findIndex(b => b.id === book.id);
        card.addEventListener("click", () => openDetail(realIndex));
        bookList.appendChild(card);
    });
}

function openDetail(index) {
    currentIndex = index;
    const book = books[index];
    document.getElementById("detail-title").textContent = book.title;
    document.getElementById("detail-author").textContent = "by " + (book.author || "unknown");
    document.getElementById("detail-genre").textContent = book.genre || "No genre";
    document.getElementById("detail-rating").textContent = "Rating: " + (book.rating || "-") + "/5";
    document.getElementById("detail-tags").textContent = book.tags && book.tags.length
        ? "Tags: " + book.tags.join(", ")
        : "No tags";
    document.getElementById("detail-notes").textContent = book.notes || "No notes";
    modal.classList.remove("hidden");
}

function closeDetail() {
    modal.classList.add("hidden");
    currentIndex = null;
}

function startEdit(index) {
    const book = books[index];
    editingIndex = index;

    document.getElementById("title").value = book.title;
    document.getElementById("author").value = book.author || "";
    document.getElementById("genre").value = book.genre || "";
    document.getElementById("rating").value = book.rating || "";
    setSelectedTags(book.tags || []);
    document.getElementById("notes").value = book.notes || "";

    formTitle.textContent = "Edit book";
    submitBtn.textContent = "Save changes";
    cancelEditBtn.classList.remove("hidden");

    closeDetail();
    form.scrollIntoView({ behavior: "smooth" });
}

function cancelEdit() {
    editingIndex = null;
    form.reset();
    setSelectedTags([]);
    formTitle.textContent = "Add any book";
    submitBtn.textContent = "Add to shelf";
    cancelEditBtn.classList.add("hidden");
}

function doSearch() {
    const searchTerm = searchBar.value.toLowerCase().trim();
    const filter = searchFilter.value;

    if (searchTerm === "") {
        renderBooks();
        return;
    }

    const filtered = books.filter(book => {
        if (filter === "title") return book.title && book.title.toLowerCase().includes(searchTerm);
        if (filter === "author") return book.author && book.author.toLowerCase().includes(searchTerm);
        if (filter === "genre") return book.genre && book.genre.toLowerCase().includes(searchTerm);
        if (filter === "tags") return book.tags && book.tags.some(tag => tag.toLowerCase().includes(searchTerm));
        return (
            (book.title && book.title.toLowerCase().includes(searchTerm)) ||
            (book.author && book.author.toLowerCase().includes(searchTerm)) ||
            (book.genre && book.genre.toLowerCase().includes(searchTerm)) ||
            (book.tags && book.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
        );
    });

    renderBooks(filtered);
}

searchBar.addEventListener("input", doSearch);
searchFilter.addEventListener("change", doSearch);

closeModal.addEventListener("click", closeDetail);

deleteBtn.addEventListener("click", async () => {
    if (currentIndex !== null && currentUser) {
        const bookId = books[currentIndex].id;
        await deleteDoc(doc(db, "books", bookId));
        books.splice(currentIndex, 1);
        renderBooks();
        closeDetail();
        searchBar.value = "";
    }
});

editBtn.addEventListener("click", () => {
    if (currentIndex !== null) startEdit(currentIndex);
});

cancelEditBtn.addEventListener("click", cancelEdit);

form.addEventListener("submit", async function(e) {
    e.preventDefault();
    if (!currentUser) {
        alert("Please log in first");
        return;
    }

    const title = document.getElementById("title").value.trim();
    if (!title) return;

    const author = document.getElementById("author").value.trim();
    const genre = document.getElementById("genre").value;
    const rating = Number(document.getElementById("rating").value) || null;
    const notes = document.getElementById("notes").value.trim();
    const tags = getSelectedTags();

    const bookData = { 
        title, author, genre, rating, notes, tags, 
        userId: currentUser.uid 
    };

    if (editingIndex !== null) {
        const bookId = books[editingIndex].id;
        await updateDoc(doc(db, "books", bookId), bookData);
        books[editingIndex] = { id: bookId, ...bookData };
        editingIndex = null;
        formTitle.textContent = "Add any book";
        submitBtn.textContent = "Add to shelf";
        cancelEditBtn.classList.add("hidden");
    } else {
        const docRef = await addDoc(collection(db, "books"), bookData);
        books.push({ id: docRef.id, ...bookData });
    }

    renderBooks();
    form.reset();
    setSelectedTags([]);
    searchBar.value = "";
});

// Auth buttons
document.getElementById("login-btn").addEventListener("click", async () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
        alert(err.message);
    }
});

document.getElementById("signup-btn").addEventListener("click", async () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    try {
        await createUserWithEmailAndPassword(auth, email, password);
    } catch (err) {
        alert(err.message);
    }
});

document.getElementById("logout-btn").addEventListener("click", () => signOut(auth));

modal.addEventListener("click", (e) => {
    if (e.target === modal) closeDetail();
});
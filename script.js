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
const searchFilter = document.getElementById("search-filter"); // SEARCH FILTER

let books = JSON.parse(localStorage.getItem("books")) || [];
let currentIndex = null;
let editingIndex = null;

function renderBooks(booksToShow = books) {
    bookList.innerHTML = "";

    booksToShow.forEach((book) => {
        const card = document.createElement("div");
        card.className = "book-card";
        card.innerHTML = `
            <strong>${book.title}</strong><br>
            by ${book.author || "unknown"}<br>
            ${book.genre || ""}<br>
            rating: ${book.rating || "-"}/5
        `;

        // Find the real index in the original books array
        const realIndex = books.findIndex(b => 
            b.title === book.title && 
            b.author === book.author && 
            b.rating === book.rating
        );

        card.addEventListener("click", () => openDetail(realIndex));
        bookList.appendChild(card);
    });
}

function openDetail(index) {
    currentIndex = index;
    const book = books[index];
    document.getElementById("detail-title").textContent = book.title;
    document.getElementById("detail-author").textContent = "by " + (book.author || "unknown");
    document.getElementById("detail-genre").textContent = book.genre || "no genre";
    document.getElementById("detail-rating").textContent = "rating: " + (book.rating || "-") + "/5";
    document.getElementById("detail-notes").textContent = book.notes || "no notes";
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
    document.getElementById("notes").value = book.notes || "";

    formTitle.textContent = "edit book";
    submitBtn.textContent = "save changes";
    cancelEditBtn.classList.remove("hidden");

    closeDetail();
    form.scrollIntoView({ behavior: "smooth" });
}

function cancelEdit() {
    editingIndex = null;
    form.reset();
    formTitle.textContent = "Add any book";
    submitBtn.textContent = "Add to shelf";
    cancelEditBtn.classList.add("hidden");
}

// SEARCH FUNCTION
function doSearch() {
    const searchTerm = searchBar.value.toLowerCase().trim();
    const filter = searchFilter.value;

    if (searchTerm === "") {
        renderBooks();
        return;
    }

    const filtered = books.filter(book => {
        if (filter === "title") {
            return book.title && book.title.toLowerCase().includes(searchTerm);
        }
        if (filter === "author") {
            return book.author && book.author.toLowerCase().includes(searchTerm);
        }
        if (filter === "genre") {
            return book.genre && book.genre.toLowerCase().includes(searchTerm);
        }
        // all
        return (
            (book.title && book.title.toLowerCase().includes(searchTerm)) ||
            (book.author && book.author.toLowerCase().includes(searchTerm)) ||
            (book.genre && book.genre.toLowerCase().includes(searchTerm))
        );
    });

    renderBooks(filtered);
}

searchBar.addEventListener("input", doSearch);
searchFilter.addEventListener("change", doSearch); // re-search when filter changes

closeModal.addEventListener("click", closeDetail);

deleteBtn.addEventListener("click", () => {
    if (currentIndex !== null) {
        books.splice(currentIndex, 1);
        localStorage.setItem("books", JSON.stringify(books));
        renderBooks();
        closeDetail();
        searchBar.value = "";
    }
});

editBtn.addEventListener("click", () => {
    if (currentIndex !== null) {
        startEdit(currentIndex);
    }
});

cancelEditBtn.addEventListener("click", cancelEdit);

form.addEventListener("submit", function(e) {
    e.preventDefault();

    const title = document.getElementById("title").value.trim();
    if (!title) return;

    const author = document.getElementById("author").value.trim();
    const genre = document.getElementById("genre").value;
    const rating = Number(document.getElementById("rating").value) || null;
    const notes = document.getElementById("notes").value.trim();

    const bookData = { title, author, genre, rating, notes };

    if (editingIndex !== null) {
        books[editingIndex] = bookData;
        editingIndex = null;
        formTitle.textContent = "Add any book";
        submitBtn.textContent = "Add to shelf";
        cancelEditBtn.classList.add("hidden");
    } else {
        books.push(bookData);
    }

    localStorage.setItem("books", JSON.stringify(books));
    renderBooks();
    form.reset();
    searchBar.value = "";
});

modal.addEventListener("click", (e) => {
    if (e.target === modal) closeDetail();
});

renderBooks();
const form = document.getElementById("book-form");
const bookList = document.getElementById("book-list");
const modal = document.getElementById("detail-modal");
const closeModal = document.getElementById("close-modal");
const deleteBtn = document.getElementById("delete-book");
const editBtn = document.getElementById("edit-book");          // NEW
const cancelEditBtn = document.getElementById("cancel-edit");  // NEW
const formTitle = document.getElementById("form-title");       // NEW
const submitBtn = document.getElementById("submit-btn");       // NEW

let books = JSON.parse(localStorage.getItem("books")) || [];
let currentIndex = null;
let editingIndex = null;  // NEW: tracks which book we’re editing (null = adding new)

function renderBooks() {
    bookList.innerHTML = "";
    books.forEach((book, index) => {
        const card = document.createElement("div");
        card.className = "book-card";
        card.innerHTML = `
            <strong>${book.title}</strong><br>
            by ${book.author || "unknown"}<br>
            ${book.genre || ""}<br>
            rating: ${book.rating || "-"}/5
        `;
        card.addEventListener("click", () => openDetail(index));
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

function startEdit(index) {  // NEW: function that fills the form for editing
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
    // scroll form into view
    form.scrollIntoView({ behavior: "smooth" });
}

function cancelEdit() {  // NEW: reset form back to "add" mode
    editingIndex = null;
    form.reset();
    formTitle.textContent = "add a book";
    submitBtn.textContent = "add to shelf";
    cancelEditBtn.classList.add("hidden");
}

closeModal.addEventListener("click", closeDetail);

deleteBtn.addEventListener("click", () => {
    if (currentIndex !== null) {
        books.splice(currentIndex, 1);
        localStorage.setItem("books", JSON.stringify(books));
        renderBooks();
        closeDetail();
    }
});

editBtn.addEventListener("click", () => {  // NEW
    if (currentIndex !== null) {
        startEdit(currentIndex);
    }
});

cancelEditBtn.addEventListener("click", cancelEdit);  // NEW

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
        // NEW: update existing book
        books[editingIndex] = bookData;
        editingIndex = null;
        formTitle.textContent = "add a book";
        submitBtn.textContent = "add to shelf";
        cancelEditBtn.classList.add("hidden");
    } else {
        // normal add
        books.push(bookData);
    }

    localStorage.setItem("books", JSON.stringify(books));
    renderBooks();
    form.reset();
});

modal.addEventListener("click", (e) => {
    if (e.target === modal) closeDetail();
});

renderBooks();
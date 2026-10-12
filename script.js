const form = document.getElementById("book-form");
const bookList = document.getElementById("book-list");
const modal = document.getElementById("detail-modal");
const closeModal = document.getElementById("close-modal");
const deleteBtn = document.getElementById("delete-book");

let books = JSON.parse(localStorage.getItem("books")) || [];
let currentIndex = null;

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

closeModal.addEventListener("click", closeDetail);

deleteBtn.addEventListener("click", () => {
    if (currentIndex !== null) {
        books.splice(currentIndex, 1);
        localStorage.setItem("books", JSON.stringify(books));
        renderBooks();
        closeDetail();
    }
});

form.addEventListener("submit", function(e) {
    e.preventDefault();

    const title = document.getElementById("title").value.trim();
    if (!title) return;

    const author = document.getElementById("author").value.trim();
    const genre = document.getElementById("genre").value;
    const rating = Number(document.getElementById("rating").value) || null;
    const notes = document.getElementById("notes").value.trim();

    books.push({ title, author, genre, rating, notes });
    localStorage.setItem("books", JSON.stringify(books));
    renderBooks();
    form.reset();
});

// closes modal if you click outside the content
modal.addEventListener("click", (e) => {
    if (e.target === modal) closeDetail();
});

renderBooks();
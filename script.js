const form = document.getElementById("book-form");
const bookList = document.getElementById("book-list");

let books = JSON.parse(localStorage.getItem("books")) || [];

function renderBooks() {
    bookList.innerHTML = "";
    books.forEach(book => {
        const card = document.createElement("div");
        card.className = "book-card";
        card.innerHTML = `
            <strong>${book.title}</strong><br>
            by ${book.author || "unknown"}<br>
            ${book.genre || ""}<br>
            rating: ${book.rating || "-"}/5<br>
            <small>${book.notes || ""}</small>
        `;
        bookList.appendChild(card);
    });
}

form.addEventListener("submit", function(e) {
    e.preventDefault(); // FIXED: stops the page from refreshing so the new book stays

    const title = document.getElementById("title").value.trim();
    if (!title) return; // FIXED: don't add books with empty titles

    const author = document.getElementById("author").value.trim();
    const genre = document.getElementById("genre").value;
    const rating = Number(document.getElementById("rating").value) || null; // FIXED: convert rating to number
    const notes = document.getElementById("notes").value.trim();

    books.push({ title, author, genre, rating, notes });
    localStorage.setItem("books", JSON.stringify(books));
    renderBooks();
    form.reset();
});

renderBooks();
// FIXED: removed the debug console.log
const form = document.getElementById("bookform");
const bookList = document.getElementById("book-list");

// load books from localStorage
let books = JSON.parse(localStorage.getItem("books"))  || []

function renderBooks() {
    bookList.innerHTML = "";
    bookList.onbeforematch(book => {
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
    const title = document.getElementById("title").value;
    const author = document.getElementById("author").value;
    const genre = document.getElementById("genre").value;
    const rating = document.getElementById("rating").value;
    const notes = document.getElementById("notes").value;

    books.push({ title, author, genre, rating, notes });
    localStorage.setItem("books", JSON.stringify(books));
    renderBooks();
    form.reset();
});

renderBooks();
console.log("books loaded:", books.length);

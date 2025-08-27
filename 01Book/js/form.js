//전역변수
const API_BASE_URL = "http://localhost:8080";

//DOM 엘리먼트 가져오기
const bookForm = document.getElementById("bookForm");
const bookTableBody = document.getElementById("bookTableBody");

document.addEventListener("DOMContentLoaded", function() {
    loadBooks();
});

bookForm.addEventListener("submit", function(event) {
    event.preventDefault();
    console.log("Form 이 체출 되었음....")

    const bookFormData = new FormData(bookForm);

    const bookData = {
        title: bookFormData.get("title").trim(),
        author: bookFormData.get("author").trim(),
        isbn: bookFormData.get("isbn").trim(),
        price: bookFormData.get("price").trim() || null,
        publishDate: bookFormData.get("publishDate") || null,
    }

    if (!validateBook(bookData)) {
        return;
    }

    console.log(bookData);
    
}); //submit 이벤트

function validateBook(book) {
    if (!book.title) {
        alert("제목을 입력해주세요.");
        return false;
    }

    if (!book.author) {
        alert("저자를 입력해주세요.");
        return false;
    }

    if (!book.isbn) {
        alert("ISBN을 입력해주세요.");
        return false;
    }

    const isbnPattern = /^(978|979)\d{10}$/;
    if (!isbnPattern.test(book.isbn)) {
        alert("ISBN은 978/979로 시작하는 숫자(13자리)만 입력 가능합니다.")
        return false;
    }

    if (!book.price) {
        alert("가격을 입력해주세요.");
        return false;
    }

    if (!book.publishDate) {
        alert("출판일을 입력해주세요.");
        return false;
    }
    return true;
}//validateBook

function loadBooks() {
    console.log("도서 목록 Load 중.....");
    fetch(`${API_BASE_URL}/api/books`)
        .then(async (response) => {
            if (!response.ok) {
                //응답 본문을 읽어서 에러 메시지 추출
                const errorData = await response.json();
                throw new Error(`${errorData.message}`);
            }
            return response.json();
        })
        .then((books) => renderBookTable(books))
        .catch((error) => {
            console.log(error);
            alert(error.message);
            bookTableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; color: #dc3545;">
                        오류: 데이터를 불러올 수 없습니다.
                    </td>
                </tr>
            `;
        });
}//loadBooks

function renderBookTable(books) {
    console.log(books);
    bookTableBody.innerHTML = "";
    books.forEach((book) => {
        const row = document.createElement("tr");

        row.innerHTML = `
                    <td>${book.title}</td>
                    <td>${book.author}</td>
                    <td>${book.isbn}</td>
                    <td>${book.price}</td>
                    <td>${book.publishDate}</td>
                    <td>
                        <button class="edit-btn" onclick="editBook(${book.isbn})">수정</button>
                        <button class="delete-btn" onclick="deleteBook(${book.isbn},'${book.title}')">삭제</button>
                    </td>
                `;
        bookTableBody.appendChild(row);
    });
}//renderBookTable
//전역변수
const API_BASE_URL = "http://localhost:8080";
// 현재 수정 중인 도서 ID
let editingBookId = null;

//DOM 엘리먼트 가져오기
const bookForm = document.getElementById("bookForm");
const bookTableBody = document.getElementById("bookTableBody");
const submitButton = document.querySelector("button[type='submit']");
const cancelButton = document.querySelector(".cancel-btn");
const formErrorSpan = document.getElementById("formError");

document.addEventListener("DOMContentLoaded", function () {
    loadBooks();
});

bookForm.addEventListener("submit", function (event) {
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

    if (editingBookId) {
        updateBook(editingBookId, bookData);
    } else {
        createBook(bookData);
    }
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
                return response.json().then(function (errorData) {
                    throw new Error(errorData.message || '도서 목록을 불러올 수 없습니다.');
                });
            }
            return response.json();
        })
        .then(function (books) {
            renderBookTable(books);
        })
        .catch(function (error) {
            console.log(error);
            showMessage(error.message);
            bookTableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; color: #dc3545;  padding: 20px;">
                        오류: 데이터를 불러올 수 없습니다.<br>
                        ${error.message}
                    </td>
                </tr>
            `;
        });
}//loadBooks

function renderBookTable(books) {
    console.log(`${books.length}권의 도서 데이터를 표시합니다.`);
    bookTableBody.innerHTML = "";

    if (books.length === 0) {
        bookTableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; color: #666; padding: 20px;">
                    등록된 도서가 없습니다.
                </td>
            </tr>
        `;
        return;
    }

    books.forEach(function (book) {
        const row = document.createElement("tr");

        row.innerHTML = `
                    <td>${book.title}</td>
                    <td>${book.author}</td>
                    <td>${book.isbn}</td>
                    <td>${book.price}</td>
                    <td>${formatDate(book.publishDate)}</td>
                    <td>
                        <button class="edit-btn" onclick="editBook(${book.isbn})">수정</button>
                        <button class="delete-btn" onclick="deleteBook(${book.isbn},'${book.title}')">삭제</button>
                    </td>
                `;
        bookTableBody.appendChild(row);
    });
}//renderBookTable

// 날짜 형식을 보기 좋게 변환
function formatDate(dateString) {
    if (!dateString) return "-";

    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('ko-KR');
    } catch (error) {
        return dateString;
    }
}

function createBook(bookData) {
    submitButton.disabled = true;
    submitButton.textContent = "등록 중...";

    fetch(`${API_BASE_URL}/api/books`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookData)
    })
        .then(function (response) {
            if (!response.ok) {
                return response.json().then(function (errorData) {
                    if (response.status === 409) {
                        throw new Error(errorData.message || '중복되는 정보가 있습니다.');
                    } else {
                        throw new Error(errorData.message || '도서 등록에 실패했습니다.');
                    }
                });
            }
            return response.json();
        })
        .then(function (result) {
            showMessage("도서가 성공적으로 등록되었습니다!", "success");
            bookForm.reset();
            loadBooks();
        })
        .catch(function (error) {
            console.log('Error : ', error);
            showMessage(error.message, "error");
        })
        .finally(function () {
            // 버튼 다시 활성화
            submitButton.disabled = false;
            submitButton.textContent = "도서 등록";
        });
}//createBook

function deleteBook(bookId) {
    if (!confirm(`ISBN = ${bookId} 도서를 정말로 삭제하시겠습니까?`)) {
        return;
    }

    console.log('삭제 처리 중...');

    fetch(`${API_BASE_URL}/api/books/isbn/${bookId}`, {
        method: 'DELETE'
    })
        .then(function (response) {
            if (!response.ok) {
                return response.json().then(function (errorData) {
                    if (response.status === 404) {
                        throw new Error(errorData.message || '존재하지 않는 도서입니다.');
                    } else {
                        throw new Error(errorData.message || '도서 삭제에 실패했습니다.');
                    }
                });
            }
            showMessage("도서가 성공적으로 삭제되었습니다!", "success");
            loadStudents();
        })
        .catch(function (error) {
            console.log('Error : ', error);
            showMessage(error.message, "error");
        });
}//deleteBook

function editBook(bookId) {
    fetch(`${API_BASE_URL}/api/books/isbn/${bookId}`)
        .then(function (response) {
            if (!response.ok) {
                return response.json().then(function (errorData) {
                    if (response.status === 404) {
                        throw new Error(errorData.message || '존재하지 않는 도서입니다.');
                    }
                });
            }
            return response.json();
        })
        .then(function (book) {
            bookForm.title.value = book.title;
            bookForm.author.value = book.author;
            bookForm.isbn.value = book.isbn;
            bookForm.price.value = book.price;
            bookForm.publishDate.value = book.publishDate;

            editingBookId = bookId;
            submitButton.textContent = "도서 수정";
            cancelButton.style.display = 'inline-block';

            bookForm.title.focus();
        })
        .catch(function (error) {
            console.log('Error : ', error);
            showMessage(error.message, "error");
        });
}//editBook

function updateBook(bookId, bookData) {
    submitButton.disabled = true;
    submitButton.textContent = "수정 중...";

    fetch(`${API_BASE_URL}/api/books/isbn/${bookId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookData)
    })
        .then(function (response) {
            if (!response.ok) {
                return response.json().then(function (errorData) {
                    if (response.status === 409) {
                        throw new Error(`${errorData.message} (에러코드: ${errorData.statusCode})` || '중복되는 정보가 있습니다.');
                    } else {
                        throw new Error(errorData.message || '도서 수정에 실패했습니다.');
                    }
                });
            }
            return response.json();
        })
        .then(function (result) {
            showMessage("학생이 성공적으로 수정되었습니다!", "success");
            resetForm();
            loadBooks();
        })
        .catch(function (error) {
            console.log('Error : ', error);
            showMessage(error.message, "error");
        })
        .finally(function () {
            // 버튼 다시 활성화
            submitButton.disabled = false;
            if (editingStudentId) {
                submitButton.textContent = "학생 수정";
            } else {
                submitButton.textContent = "학생 등록";
            }
        });
}//updateBook

function resetForm() {
    bookForm.reset();
    editingBookId = null;
    submitButton.textContent = "도서 등록";
    cancelButton.style.display = 'none';
    hideMessage();
}//resetForm

// 메시지 표시 함수 (성공/에러 통합)
function showMessage(message, type) {
    formErrorSpan.textContent = message;
    formErrorSpan.style.display = 'block';

    if (type === "success") {
        formErrorSpan.style.color = '#28a745';
        formErrorSpan.style.backgroundColor = '#d4edda';
        formErrorSpan.style.borderColor = '#c3e6cb';
    } else {
        formErrorSpan.style.color = '#dc3545';
        formErrorSpan.style.backgroundColor = '#f8d7da';
        formErrorSpan.style.borderColor = '#f5c6cb';
    }

    // 3초 후 자동으로 메시지 숨김
    setTimeout(function () {
        hideMessage();
    }, 3000);
}

// 메시지 숨김
function hideMessage() {
    formErrorSpan.style.display = 'none';
    formErrorSpan.style.backgroundColor = '';
    formErrorSpan.style.borderColor = '';
}
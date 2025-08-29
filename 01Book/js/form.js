//전역변수
const API_BASE_URL = "http://localhost:8080";
// 현재 수정 중인 도서 ID
let editingBookId = null;

//DOM 엘리먼트 가져오기
const bookForm = document.getElementById("bookForm");
const bookTableBody = document.getElementById("bookTableBody");
const submitButton = document.querySelector("button[type='submit']");
const cancelButton = document.querySelector(".cancel-btn");
const loadingMessage = document.getElementById('loadingMessage');
const formErrorSpan = document.getElementById("formError");

document.addEventListener("DOMContentLoaded", function () {
    console.log('페이지 로드 완료');
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
        detail: {
            description: bookFormData.get('description').trim(),
            language: bookFormData.get('language').trim(),
            pageCount: bookFormData.get('pageCount') ? parseInt(bookFormData.get('pageCount')) : null,
            publisher: bookFormData.get('publisher').trim(),
            coverImageUrl: bookFormData.get('coverImageUrl').trim(),
            edition: bookFormData.get('edition').trim()
        }
    };

    if (!validateBook(bookData)) {
        return;
    }

    // console.log(bookData);

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

    const isbnPattern = /^[0-9X-]+$/; //^(978|979)\d{10}$/;
    if (!isbnPattern.test(book.isbn)) {
        alert("올바른 ISBN 형식이 아닙니다. (숫자와 X, -만 허용)") //ISBN은 978/979로 시작하는 숫자(13자리)만 입력 가능합니다.
        return false;
    }

    if (book.price !== null && book.price < 0) {
        alert("가격은 0 이상이어야 합니다.");
        return false;
    }

    if (book.detail.pageCount !== null && book.detail.pageCount < 0) {
        alert('페이지 수는 0 이상이어야 합니다.');
        return false;
    }

    if (book.detail.coverImageUrl && !isValidUrl(book.detail.coverImageUrl)) {
        alert('올바른 이미지 URL 형식이 아닙니다.');
        return false;
    }
    return true;
}//validateBook

// URL 유효성 검사
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

function loadBooks() {
    showLoading(true);
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
        .then(function (books) {
            renderBookTable(books);
        })
        .catch(function (error) {
            console.log(error);
            showMessage(error.message); //
            bookTableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; color: #dc3545;  padding: 20px;">
                        오류: 데이터를 불러올 수 없습니다.<br>
                        ${error.message}
                    </td>
                </tr>
            `;
        })
        .finally(() => {
            showLoading(false);
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

        const formattedPrice = book.price ? `₩${book.price.toLocaleString()}` : '-';
        const formattedDate = book.publishDate || '-';
        const publisher = book.detail ? book.detail.publisher || '-' : '-';

        row.innerHTML = `
                    <td>${book.title}</td>
                    <td>${book.author}</td>
                    <td>${book.isbn}</td>
                    <td>${formattedPrice}</td>
                    <td>${formattedDate}</td>
                    <td>${publisher}</td>
                    <td>${formatDate(book.publishDate)}</td>
                    <td>
                        <button class="edit-btn" onclick="editBook(${book.id})">수정</button>
                        <button class="delete-btn" onclick="deleteBook(${book.id}, '${book.isbn}')">삭제</button>
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
    setLoading(true);
    // submitButton.disabled = true;
    // submitButton.textContent = "등록 중...";

    fetch(`${API_BASE_URL}/api/books`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookData)
    })
        .then(async (response) => {
            if (!response.ok) {
                const errorData = await response.json();
                if (response.status === 409) {
                    throw new Error(errorData.message || '중복되는 정보가 있습니다.');
                } else {
                    throw new Error(errorData.message || '도서 등록에 실패했습니다.');
                }
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
            showMessage(error.message, "error"); //
        })
        .finally(function () {
            // 버튼 다시 활성화
            setLoading(false);
            // submitButton.disabled = false;
            // submitButton.textContent = "도서 등록";
        });
}//createBook

function deleteBook(bookId, bookIsbn) {
    if (!confirm(`ISBN = ${bookIsbn} 도서를 정말로 삭제하시겠습니까?`)) {
        return;
    }

    console.log('삭제 처리 중...');

    fetch(`${API_BASE_URL}/api/books/${bookId}`, {
        method: 'DELETE'
    })
        .then(async (response) => {
            if (!response.ok) {
                //응답 본문을 읽어서 에러 메시지 추출
                const errorData = await response.json();
                //status code와 message를 확인하기
                if (response.status === 404) {
                    //중복 오류 처리
                    throw new Error(errorData.message || '존재하지 않는 도서입니다다.');
                } else {
                    //기타 오류 처리
                    throw new Error(errorData.message || '도서 삭제에 실패했습니다.')
                }
            }
            showMessage("도서가 성공적으로 삭제되었습니다!", "success"); //
            loadBooks();
        })
        .catch(function (error) {
            console.log('Error : ', error);
            showMessage(error.message, "error");
        });
}//deleteBook

function editBook(bookId) {
    setLoading(true);

    fetch(`${API_BASE_URL}/api/books/${bookId}`)
        .then(async (response) => {
            if (!response.ok) {
                //응답 본문을 읽어서 에러 메시지 추출
                const errorData = await response.json();
                //status code와 message를 확인하기
                if (response.status === 404) {
                    //중복 오류 처리
                    throw new Error(errorData.message || '존재하지 않는 학생입니다.');
                }
            }
            return response.json();
        })
        .then(function (book) {
            bookForm.title.value = book.title;
            bookForm.author.value = book.author;
            bookForm.isbn.value = book.isbn;
            bookForm.price.value = book.price || '';
            bookForm.publishDate.value = book.publishDate || '';

            // 폼에 상세 정보 채우기
            if (book.detail) {
                bookForm.description.value = book.detail.description || '';
                bookForm.language.value = book.detail.language || '';
                bookForm.pageCount.value = book.detail.pageCount || '';
                bookForm.publisher.value = book.detail.publisher || '';
                bookForm.coverImageUrl.value = book.detail.coverImageUrl || '';
                bookForm.edition.value = book.detail.edition || '';
            }

            editingBookId = bookId;
            submitButton.textContent = "도서 수정";
            cancelButton.style.display = 'inline-block';

            bookForm.scrollIntoView({ behavior: 'smooth' });
        })
        .catch(function (error) {
            console.log('Error : ', error);
            showMessage(error.message, "error");
        })
        .finally(() => {
            setLoading(false);
        });
}//editBook

function updateBook(bookId, bookData) {
    setLoading(true);
    // submitButton.disabled = true;
    // submitButton.textContent = "수정 중...";

    fetch(`${API_BASE_URL}/api/books/${bookId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookData)
    })
        .then(async (response) => {
            if (!response.ok) {
                //응답 본문을 읽어서 에러 메시지 추출 
                //errorData 객체는 서버의 ErrorObject와 매핑이 된다.
                const errorData = await response.json();
                //status code와 message를 확인하기
                if (response.status === 409) {
                    //중복 오류 처리
                    throw new Error(`${errorData.message} ( 에러코드: ${errorData.statusCode} )` || '중복 되는 정보가 있습니다.');
                } else {
                    //기타 오류 처리
                    throw new Error(errorData.message || '도서 수정에 실패했습니다.')
                }
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
            setLoading(false);
            // 버튼 다시 활성화
            // submitButton.disabled = false;
            // if (editingBookId) {
            //     submitButton.textContent = "학생 수정";
            // } else {
            //     submitButton.textContent = "학생 등록";
            // }
        });
}//updateBook

function resetForm() {
    bookForm.reset();
    editingBookId = null;
    submitButton.textContent = "도서 등록";
    cancelButton.style.display = 'none';
    hideMessage();
    // clearMessages();
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

// 로딩 상태 표시/숨김
function showLoading(show) {
    if (show) {
        loadingMessage.style.display = 'block';
        bookTableBody.innerHTML = '';
    } else {
        loadingMessage.style.display = 'none';
    }
}

// 폼 로딩 상태 설정
function setLoading(loading) {
    submitButton.disabled = loading;
    if (loading) {
        submitButton.textContent = editingBookId ? '수정 중...' : '등록 중...';
    } else {
        submitButton.textContent = editingBookId ? '도서 수정' : '도서 등록';
    }
}
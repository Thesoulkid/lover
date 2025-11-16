document.addEventListener('DOMContentLoaded', function () {
    const book = document.getElementById('book');
    const passwordModal = document.getElementById('password-modal');
    const passwordInput = document.getElementById('password-input');
    const passwordButton = document.getElementById('password-button');
    const errorMessage = document.getElementById('error-message');
    const mainBook = document.getElementById('main-book');
    const bookContainer = document.getElementById('book-container');

    book.addEventListener('click', () => {
        book.classList.add('open');
        setTimeout(() => {
            passwordModal.classList.remove('hidden');
        }, 1000); // Wait for the book cover animation to finish
    });

    passwordButton.addEventListener('click', () => {
        const password = passwordInput.value;
        if (password === '281025') {
            passwordModal.classList.add('hidden');
            bookContainer.classList.add('hidden');
            mainBook.classList.remove('hidden');

            // Initialize turn.js
            $('#flipbook').turn({
                width: 800,
                height: 600,
                autoCenter: true
            });
        } else {
            errorMessage.classList.remove('hidden');
        }
    });
});

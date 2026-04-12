const keywordForm = document.getElementById('keywordForm');
const keywordInput = document.getElementById('keyword');
const keywordError = document.getElementById('keywordError');

if (keywordForm && keywordInput && keywordError) {
    keywordForm.addEventListener('submit', (event) => {
        const keyword = keywordInput.value.trim();

        if (keyword.length < 3) {
            event.preventDefault();
            keywordError.textContent = 'Keyword must be at least 3 characters long.';
            keywordError.classList.add('is-visible');
            keywordInput.focus();
            return;
        }

        keywordError.textContent = '';
        keywordError.classList.remove('is-visible');
    });
}
const authorLinks = document.querySelectorAll('.author-link, .authorNames');
const authorDialog = document.getElementById('authorInfoDialog');
const closeAuthorButton = document.getElementById('closeAuthorInfo');
const authorName = document.getElementById('authorName');
const authorImage = document.getElementById('authorImg');
const authorMeta = document.getElementById('authorMeta');
const authorError = document.getElementById('authorError');

if (authorImage) {
    authorImage.addEventListener('error', () => {
        authorImage.hidden = true;
        authorError.textContent = 'Portrait could not be loaded.';
        authorError.classList.add('is-visible');
    });
}

const labelMap = {
    authorId: 'Author ID',
    firstName: 'First Name',
    lastName: 'Last Name',
    profession: 'Profession',
    country: 'Country',
    dateOfBirth: 'Date of Birth',
    dateOfDeath: 'Date of Death',
    bio: 'Bio'
};

for (const authorLink of authorLinks) {
    authorLink.addEventListener('click', displayAuthorInfo);
}

if (closeAuthorButton && authorDialog) {
    closeAuthorButton.addEventListener('click', closeAuthorModal);

    authorDialog.addEventListener('click', (event) => {
        if (event.target instanceof HTMLElement && event.target.dataset.closeModal === 'true') {
            closeAuthorModal();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !authorDialog.hasAttribute('hidden')) {
            closeAuthorModal();
        }
    });
}

async function displayAuthorInfo(event) {
    event.preventDefault();

    if (!authorDialog) {
        return;
    }

    const authorId = this.dataset.authorId || this.getAttribute('authorId');

    authorName.textContent = 'Loading author details...';
    authorError.textContent = '';
    authorError.classList.remove('is-visible');
    authorMeta.innerHTML = '';
    authorImage.removeAttribute('src');
    authorImage.hidden = true;
    authorDialog.hidden = false;
    document.body.classList.add('modal-open');

    try {
        const response = await fetch(`/api/author/${authorId}`);
        const authorInfo = await response.json();

        if (!response.ok) {
            throw new Error(authorInfo.error || 'Author not found');
        }

        renderAuthorInfo(authorInfo);
    } catch (error) {
        authorName.textContent = 'Author details unavailable';
        authorError.textContent = error.message;
        authorError.classList.add('is-visible');
    }
}

function renderAuthorInfo(authorInfo) {
    authorName.textContent = `${authorInfo.firstName || ''} ${authorInfo.lastName || ''}`.trim() || 'Author details';
    authorMeta.innerHTML = '';

    const imageSource = getAuthorImage(authorInfo);

    if (imageSource) {
        authorImage.src = imageSource;
        authorImage.alt = `${authorName.textContent} portrait`;
        authorImage.hidden = false;
    }

    const entries = Object.entries(authorInfo)
        .filter(([key, value]) => !isImageField(key) && value !== null && value !== '');

    for (const [key, value] of entries) {
        const row = document.createElement('p');
        const label = labelMap[key] || formatLabel(key);

        row.className = 'author-meta-row';
        row.innerHTML = `<strong>${label}:</strong> ${value}`;
        authorMeta.append(row);
    }
}

function formatLabel(key) {
    return key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (letter) => letter.toUpperCase());
}

function closeAuthorModal() {
    if (!authorDialog) {
        return;
    }

    authorDialog.hidden = true;
    document.body.classList.remove('modal-open');
}

function getAuthorImage(authorInfo) {
    const directPortrait = typeof authorInfo.portrait === 'string' ? authorInfo.portrait.trim() : '';

    if (directPortrait) {
        return normalizeImageUrl(directPortrait);
    }

    const imageEntry = Object.entries(authorInfo).find(([key, value]) => isImageField(key) && typeof value === 'string' && value.trim() !== '');
    return imageEntry ? normalizeImageUrl(imageEntry[1]) : '';
}

function isImageField(key) {
    return /picture|image|photo|portrait|headshot/i.test(key);
}

function normalizeImageUrl(url) {
    if (window.location.protocol === 'https:' && url.startsWith('http://')) {
        return `https://${url.slice(7)}`;
    }

    return url;
}
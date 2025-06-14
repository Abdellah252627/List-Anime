// متغيرات عامة
let currentFilter = 'all';
let currentSearchQuery = '';
let currentSort = 'dateAdded-desc';
let sortOrder = 'desc';

// عناصر DOM
const addAnimeBtn = document.getElementById('addAnimeBtn');
const addAnimeModal = document.getElementById('addAnimeModal');
const editAnimeModal = document.getElementById('editAnimeModal');
const animeForm = document.getElementById('animeForm');
const editAnimeForm = document.getElementById('editAnimeForm');
const animeList = document.getElementById('animeList');
const searchInput = document.getElementById('searchInput');
const filterBtns = document.querySelectorAll('.filter-btn');
const emptyMessage = document.getElementById('emptyMessage');
const sortSelect = document.getElementById('sortSelect');
const sortOrderBtn = document.getElementById('sortOrderBtn');

// عناصر الإحصائيات
const watchingCount = document.getElementById('watchingCount');
const completedCount = document.getElementById('completedCount');
const planToWatchCount = document.getElementById('planToWatchCount');
const ongoingCount = document.getElementById('ongoingCount');
const finishedCount = document.getElementById('finishedCount');
const notAiredCount = document.getElementById('notAiredCount');
const totalCount = document.getElementById('totalCount');

// تهيئة التطبيق
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
});

// تهيئة التطبيق
function initializeApp() {
    displayAnimes();
    updateStats();
    updateSortOrderButton(); // تحديث زر الترتيب
}

// إعداد مستمعي الأحداث
function setupEventListeners() {
    // فتح نموذج إضافة أنمي
    addAnimeBtn.addEventListener('click', () => {
        addAnimeModal.style.display = 'block';
        resetStarRating('starRating', 'ratingValue');
    });

    // إغلاق النماذج
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            modal.style.display = 'none';
            
            // إعادة تعيين نموذج التعديل عند إغلاقه
            if (modal.id === 'editAnimeModal') {
                resetEditForm();
            }
        });
    });

    // إغلاق النماذج عند النقر خارجها
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
            
            // إعادة تعيين نموذج التعديل عند إغلاقه
            if (e.target.id === 'editAnimeModal') {
                resetEditForm();
            }
        }
    });

    // إرسال نموذج إضافة أنمي
    animeForm.addEventListener('submit', handleAddAnime);

    // إرسال نموذج تعديل أنمي
    editAnimeForm.addEventListener('submit', handleEditAnime);

    // البحث
    searchInput.addEventListener('input', handleSearch);

    // الفلاتر
    filterBtns.forEach(btn => {
        btn.addEventListener('click', handleFilter);
    });

    // الترتيب
    if (sortSelect) {
        sortSelect.addEventListener('change', handleSortChange);
    }
    
    if (sortOrderBtn) {
        sortOrderBtn.addEventListener('click', toggleSortOrder);
    }

    // إعداد نظام التقييم بالنجوم
    setupStarRating('starRating', 'ratingValue', 'animeRating');
    setupStarRating('editStarRating', 'editRatingValue', 'editAnimeRating');

    // تحديث تلقائي للحالة عند تغيير عدد الحلقات المشاهدة
    document.getElementById('watchedEpisodes').addEventListener('input', function() {
        const totalEpisodes = parseInt(document.getElementById('totalEpisodes').value) || 0;
        const watchedEpisodes = parseInt(this.value) || 0;
        
        if (watchedEpisodes >= totalEpisodes && totalEpisodes > 0) {
            document.getElementById('animeStatus').value = 'completed';
        }
    });

    document.getElementById('editWatchedEpisodes').addEventListener('input', function() {
        const totalEpisodes = parseInt(document.getElementById('editTotalEpisodes').value) || 0;
        const watchedEpisodes = parseInt(this.value) || 0;
        
        if (watchedEpisodes >= totalEpisodes && totalEpisodes > 0) {
            document.getElementById('editAnimeStatus').value = 'completed';
        }
    });
}

// معالجة إضافة أنمي جديد
function handleAddAnime(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const animeData = {
        name: formData.get('animeName') || document.getElementById('animeName').value,
        image: formData.get('animeImage') || document.getElementById('animeImage').value,
        totalEpisodes: formData.get('totalEpisodes') || document.getElementById('totalEpisodes').value,
        watchedEpisodes: formData.get('watchedEpisodes') || document.getElementById('watchedEpisodes').value,
        status: formData.get('animeStatus') || document.getElementById('animeStatus').value,
        rating: formData.get('animeRating') || document.getElementById('animeRating').value,
        notes: formData.get('animeNotes') || document.getElementById('animeNotes').value,
        genres: getSelectedGenres('genreCheckboxes'),
        type: document.getElementById('animeType').value,
        season: document.getElementById('animeSeason').value
    };

    // التحقق من صحة البيانات
    if (!animeData.name.trim()) {
        alert('يرجى إدخال اسم الأنمي');
        return;
    }

    if (!animeData.totalEpisodes || animeData.totalEpisodes < 1) {
        alert('يرجى إدخال عدد صحيح للحلقات');
        return;
    }

    // التحقق من التكرار
    const duplicateCheck = checkForDuplicates(animeData.name);
    
    if (duplicateCheck.hasDuplicate || duplicateCheck.hasSimilar) {
        // حفظ البيانات للاستخدام لاحقاً
        window.pendingAnimeData = animeData;
        
        // إظهار نافذة التحذير
        showDuplicateWarning(duplicateCheck, animeData);
        return;
    }

    // إضافة الأنمي مباشرة إذا لم يكن هناك تكرار
    proceedWithAnimeAdd(animeData);
}

// التحقق من التكرار والتشابه
function checkForDuplicates(animeName) {
    const exactDuplicate = animeDB.checkDuplicate(animeName);
    const similarAnimes = animeDB.findSimilarAnimes(animeName, 0.7);
    
    return {
        hasDuplicate: !!exactDuplicate,
        exactDuplicate: exactDuplicate,
        hasSimilar: similarAnimes.length > 0,
        similarAnimes: similarAnimes
    };
}

// إظهار نافذة تحذير التكرار
function showDuplicateWarning(duplicateCheck, newAnimeData) {
    const modal = document.getElementById('duplicateWarningModal');
    const exactMatchDiv = document.getElementById('duplicateExactMatch');
    const similarMatchesDiv = document.getElementById('duplicateSimilarMatches');
    const existingAnimeInfo = document.getElementById('existingAnimeInfo');
    const similarAnimesList = document.getElementById('similarAnimesList');
    const newAnimePreview = document.getElementById('newAnimePreview');
    
    // إخفاء جميع الأقسام أولاً
    exactMatchDiv.style.display = 'none';
    similarMatchesDiv.style.display = 'none';
    
    // إظهار التطابق التام إذا وُجد
    if (duplicateCheck.hasDuplicate) {
        exactMatchDiv.style.display = 'block';
        existingAnimeInfo.innerHTML = createAnimeInfoHTML(duplicateCheck.exactDuplicate);
    }
    
    // إظهار التطابقات المشابهة إذا وُجدت
    if (duplicateCheck.hasSimilar) {
        similarMatchesDiv.style.display = 'block';
        similarAnimesList.innerHTML = duplicateCheck.similarAnimes.map(item => 
            createSimilarAnimeHTML(item.anime, item.similarity)
        ).join('');
    }
    
    // إظهار معاينة الأنمي الجديد
    newAnimePreview.innerHTML = createAnimeInfoHTML(newAnimeData, true);
    
    // إظهار النافذة
    modal.style.display = 'block';
}

// إنشاء HTML لمعلومات الأنمي
function createAnimeInfoHTML(anime, isNew = false) {
    const statusText = getStatusText(anime.status);
    const typeText = getTypeText(anime.type);
    
    return `
        <div class="anime-info-item">
            ${anime.image ? `<img src="${anime.image}" alt="${anime.name}" onerror="this.src='https://via.placeholder.com/50x70?text=No+Image'">` : ''}
            <div class="anime-info-details">
                <h5>${anime.name}</h5>
                <p><strong>الحالة:</strong> ${statusText}</p>
                <p><strong>النوع:</strong> ${typeText || 'غير محدد'}</p>
                <p><strong>الحلقات:</strong> ${anime.watchedEpisodes || 0}/${anime.totalEpisodes || 'غير محدد'}</p>
                <p><strong>التقييم:</strong> ${anime.rating ? anime.rating + '/10' : 'غير مقيم'}</p>
                ${!isNew && anime.dateAdded ? `<p><strong>تاريخ الإضافة:</strong> ${new Date(anime.dateAdded).toLocaleDateString('ar-EG')}</p>` : ''}
            </div>
        </div>
    `;
}

// إنشاء HTML للأنميات المشابهة
function createSimilarAnimeHTML(anime, similarity) {
    const similarityPercentage = Math.round(similarity * 100);
    
    return `
        <div class="similar-anime-item">
            <div class="anime-info-item">
                ${anime.image ? `<img src="${anime.image}" alt="${anime.name}" onerror="this.src='https://via.placeholder.com/50x70?text=No+Image'">` : ''}
                <div class="anime-info-details">
                    <h5>${anime.name}</h5>
                    <p><strong>الحالة:</strong> ${getStatusText(anime.status)}</p>
                    <p><strong>الحلقات:</strong> ${anime.watchedEpisodes}/${anime.totalEpisodes}</p>
                </div>
            </div>
            <div class="similarity-score">${similarityPercentage}% متشابه</div>
        </div>
    `;
}

// إغلاق نافذة تحذير التكرار
function closeDuplicateWarning() {
    const modal = document.getElementById('duplicateWarningModal');
    modal.style.display = 'none';
    window.pendingAnimeData = null;
}

// المتابعة مع إضافة الأنمي
function proceedWithAnimeAdd(animeData = null) {
    const dataToAdd = animeData || window.pendingAnimeData;
    
    if (!dataToAdd) {
        showNotification('حدث خطأ في البيانات', 'error');
        return;
    }
    
    try {
        const newAnime = animeDB.addAnime(dataToAdd);
        if (newAnime) {
            displayAnimes();
            updateStats();
            animeForm.reset();
            resetStarRating('starRating', 'ratingValue');
            clearSelectedGenres('genreCheckboxes');
            document.getElementById('animeType').value = '';
            document.getElementById('animeSeason').value = '';
            addAnimeModal.style.display = 'none';
            closeDuplicateWarning();
            showNotification('تم إضافة الأنمي بنجاح!', 'success');
        }
    } catch (error) {
        console.error('خطأ في إضافة الأنمي:', error);
        showNotification('حدث خطأ أثناء إضافة الأنمي', 'error');
    }
}

// العودة لتعديل البيانات
function editAnimeData() {
    closeDuplicateWarning();
    // النافذة الأصلية ستبقى مفتوحة للتعديل
}

// معالجة تغيير الترتيب
function handleSortChange(e) {
    currentSort = e.target.value;
    const [field, order] = currentSort.split('-');
    sortOrder = order;
    updateSortOrderButton();
    displayAnimes();
}

// تبديل اتجاه الترتيب
function toggleSortOrder() {
    sortOrder = sortOrder === 'desc' ? 'asc' : 'desc';
    const [field] = currentSort.split('-');
    currentSort = `${field}-${sortOrder}`;
    sortSelect.value = currentSort;
    updateSortOrderButton();
    displayAnimes();
}

// تحديث زر اتجاه الترتيب
function updateSortOrderButton() {
    if (sortOrderBtn) {
        sortOrderBtn.className = `sort-order-btn ${sortOrder}`;
        const icon = sortOrderBtn.querySelector('i');
        if (icon) {
            icon.className = sortOrder === 'desc' ? 'fas fa-sort-amount-down' : 'fas fa-sort-amount-up';
        }
        sortOrderBtn.title = sortOrder === 'desc' ? 'ترتيب تنازلي' : 'ترتيب تصاعدي';
    }
}

// ترتيب الأنميات
function sortAnimes(animes) {
    const [field, order] = currentSort.split('-');
    
    return animes.sort((a, b) => {
        let valueA, valueB;
        
        switch (field) {
            case 'name':
                valueA = a.name.toLowerCase();
                valueB = b.name.toLowerCase();
                break;
            case 'rating':
                valueA = a.rating || 0;
                valueB = b.rating || 0;
                break;
            case 'progress':
                valueA = a.totalEpisodes > 0 ? (a.watchedEpisodes / a.totalEpisodes) : 0;
                valueB = b.totalEpisodes > 0 ? (b.watchedEpisodes / b.totalEpisodes) : 0;
                break;
            case 'episodes':
                valueA = a.totalEpisodes || 0;
                valueB = b.totalEpisodes || 0;
                break;
            case 'dateAdded':
            default:
                valueA = new Date(a.dateAdded || 0);
                valueB = new Date(b.dateAdded || 0);
                break;
        }
        
        if (order === 'asc') {
            return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
        } else {
            return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
        }
    });
}

// معالجة تعديل أنمي
function handleEditAnime(e) {
    e.preventDefault();
    
    const animeId = document.getElementById('editAnimeId').value;
    const updateData = {
        name: document.getElementById('editAnimeName').value,
        image: document.getElementById('editAnimeImage').value,
        totalEpisodes: document.getElementById('editTotalEpisodes').value,
        watchedEpisodes: document.getElementById('editWatchedEpisodes').value,
        status: document.getElementById('editAnimeStatus').value,
        rating: document.getElementById('editAnimeRating').value,
        notes: document.getElementById('editAnimeNotes').value,
        genres: getSelectedGenres('editGenreCheckboxes'),
        type: document.getElementById('editAnimeType').value,
        season: document.getElementById('editAnimeSeason').value
    };

    // التحقق من صحة البيانات
    if (!updateData.name.trim()) {
        alert('يرجى إدخال اسم الأنمي');
        return;
    }

    if (!updateData.totalEpisodes || updateData.totalEpisodes < 1) {
        alert('يرجى إدخال عدد صحيح للحلقات');
        return;
    }

    try {
        const updatedAnime = animeDB.updateAnime(animeId, updateData);
        if (updatedAnime) {
            displayAnimes();
            updateStats();
            editAnimeModal.style.display = 'none';
            showNotification('تم تحديث الأنمي بنجاح!', 'success');
        }
    } catch (error) {
        console.error('خطأ في تحديث الأنمي:', error);
        showNotification('حدث خطأ أثناء تحديث الأنمي', 'error');
    }
}

// معالجة البحث
function handleSearch(e) {
    currentSearchQuery = e.target.value;
    displayAnimes();
}

// معالجة الفلاتر
function handleFilter(e) {
    // إزالة الفئة النشطة من جميع الأزرار
    filterBtns.forEach(btn => btn.classList.remove('active'));
    
    // إضافة الفئة النشطة للزر المحدد
    e.target.classList.add('active');
    
    currentFilter = e.target.dataset.filter;
    displayAnimes();
}

// عرض الأنميات
function displayAnimes() {
    let animes = animeDB.getAllAnimes();
    
    // تطبيق البحث
    if (currentSearchQuery) {
        animes = animeDB.searchAnimes(currentSearchQuery);
    }
    
    // تطبيق الفلتر
    if (currentFilter !== 'all') {
        animes = animes.filter(anime => anime.status === currentFilter);
    }
    
    // تطبيق الترتيب
    animes = sortAnimes([...animes]);
    
    // مسح القائمة الحالية
    animeList.innerHTML = '';
    
    if (animes.length === 0) {
        emptyMessage.style.display = 'block';
        return;
    }
    
    emptyMessage.style.display = 'none';
    
    // إنشاء بطاقات الأنميات
    animes.forEach(anime => {
        const animeCard = createAnimeCard(anime);
        animeList.appendChild(animeCard);
    });
}

// إنشاء بطاقة أنمي
function createAnimeCard(anime) {
    const card = document.createElement('div');
    card.className = 'anime-card';
    card.dataset.animeId = anime.id;
    
    const progress = (anime.watchedEpisodes / anime.totalEpisodes) * 100;
    const statusClass = `status-${anime.status}`;
    const statusText = getStatusText(anime.status);
    
    card.innerHTML = `
        ${anime.image ? 
            `<img src="${anime.image}" alt="${anime.name}" class="anime-image" 
                  onclick="openImageModal('${anime.image}', '${anime.name}')"
                  onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
             <div class="anime-image" style="display: none;"><i class="fas fa-image"></i></div>` :
            `<div class="anime-image"><i class="fas fa-image"></i></div>`
        }
        
        <div class="anime-info">
            <h3 class="anime-title">${anime.name}</h3>
            
            <span class="anime-status ${statusClass}">${statusText}</span>
            
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${progress}%"></div>
            </div>
            
            <div class="episode-info">
                <span>الحلقات: ${anime.watchedEpisodes}/${anime.totalEpisodes}</span>
                <span>${Math.round(progress)}%</span>
            </div>
            
            ${anime.rating ? `
                <div class="rating">
                    <div class="stars-display">
                        ${generateStarsDisplay(anime.rating)}
                    </div>
                    <span>${anime.rating}/10</span>
                </div>
            ` : ''}
            
            ${anime.notes ? `
                <button class="notes-toggle" onclick="toggleNotes('${anime.id}')">
                    <i class="fas fa-sticky-note"></i> عرض الملاحظات
                </button>
                <div class="anime-notes" id="notes-${anime.id}" style="display: none;">
                    ${anime.notes}
                </div>
            ` : ''}
            
            ${anime.genres && anime.genres.length > 0 ? `
                <div class="anime-genres">
                    ${anime.genres.map(genre => `<span class="genre-tag">${genre}</span>`).join('')}
                </div>
            ` : ''}
            
            <div class="anime-meta">
                ${anime.type ? `<span class="meta-tag type-tag">${getTypeText(anime.type)}</span>` : ''}
                ${anime.season ? `<span class="meta-tag season-tag">${getSeasonText(anime.season)}</span>` : ''}
            </div>
            
            <div class="anime-actions">
                ${anime.watchedEpisodes < anime.totalEpisodes ? 
                    `<button class="action-btn increment-btn" onclick="incrementEpisode('${anime.id}')">
                        <i class="fas fa-plus"></i> حلقة
                    </button>` : ''
                }
                <button class="action-btn edit-btn" onclick="editAnime('${anime.id}')">
                    <i class="fas fa-edit"></i> تعديل
                </button>
                <button class="action-btn delete-btn" onclick="deleteAnime('${anime.id}')">
                    <i class="fas fa-trash"></i> حذف
                </button>
            </div>
        </div>
    `;
    
    return card;
}

// الحصول على نص الحالة
function getStatusText(status) {
    switch (status) {
        case 'watching':
            return 'أشاهدها حالياً';
        case 'plan-to-watch':
            return 'سأكملها لاحقاً';
        case 'completed':
            return 'تمت مشاهدتها';
        case 'ongoing':
            return 'مستمرة';
        case 'finished':
            return 'مكتملة';
        case 'not-aired':
            return 'لم يتم بثه بعد';
        default:
            return 'غير محدد';
    }
}

// زيادة عدد الحلقات المشاهدة
function incrementEpisode(animeId) {
    try {
        const updatedAnime = animeDB.incrementWatchedEpisodes(animeId);
        if (updatedAnime) {
            displayAnimes();
            updateStats();
            
            // إشعار إذا تم إكمال الأنمي
            if (updatedAnime.watchedEpisodes === updatedAnime.totalEpisodes) {
                showNotification(`تهانينا! لقد أكملت مشاهدة "${updatedAnime.name}"`, 'success');
            }
        }
    } catch (error) {
        console.error('خطأ في تحديث الحلقات:', error);
        showNotification('حدث خطأ أثناء تحديث الحلقات', 'error');
    }
}

// تعديل أنمي
function editAnime(animeId) {
    const anime = animeDB.getAnimeById(animeId);
    if (!anime) {
        showNotification('لم يتم العثور على الأنمي', 'error');
        return;
    }
    
    console.log('تحرير الأنمي:', anime); // للتشخيص
    
    // ملء النموذج بالبيانات الحالية
    document.getElementById('editAnimeId').value = anime.id;
    document.getElementById('editAnimeName').value = anime.name || '';
    document.getElementById('editAnimeImage').value = anime.image || '';
    document.getElementById('editTotalEpisodes').value = anime.totalEpisodes || '';
    document.getElementById('editWatchedEpisodes').value = anime.watchedEpisodes || 0;
    document.getElementById('editAnimeStatus').value = anime.status || 'watching';
    document.getElementById('editAnimeNotes').value = anime.notes || '';
    
    // تحديث النوع والموسم
    document.getElementById('editAnimeType').value = anime.type || '';
    document.getElementById('editAnimeSeason').value = anime.season || '';
    
    // تحديث التصنيفات
    console.log('التصنيفات:', anime.genres); // للتشخيص
    setSelectedGenres('editGenreCheckboxes', anime.genres || []);
    
    // تحديث التقييم والنجوم
    const rating = anime.rating || 0;
    document.getElementById('editAnimeRating').value = rating;
    
    // تحديث عرض النجوم والتقييم
    setStarRating('editStarRating', 'editRatingValue', 'editAnimeRating', rating);
    
    console.log('تم ملء النموذج بالبيانات'); // للتشخيص
    
    // عرض النموذج
    editAnimeModal.style.display = 'block';
    
    // التأكد من تحديث جميع العناصر بعد عرض النموذج
    setTimeout(() => {
        // إعادة تطبيق التقييم للتأكد من العرض الصحيح
        setStarRating('editStarRating', 'editRatingValue', 'editAnimeRating', rating);
        
        // التركيز على حقل الاسم
        document.getElementById('editAnimeName').focus();
        
        // التحقق من التصنيفات مرة أخرى
        setSelectedGenres('editGenreCheckboxes', anime.genres || []);
        
        console.log('تم تحديث جميع العناصر بنجاح');
    }, 150);
}

// إعادة تعيين نموذج التعديل
function resetEditForm() {
    // إعادة تعيين جميع الحقول
    document.getElementById('editAnimeForm').reset();
    
    // إعادة تعيين التقييم
    resetStarRating('editStarRating', 'editRatingValue');
    
    // إعادة تعيين التصنيفات
    clearSelectedGenres('editGenreCheckboxes');
    
    console.log('تم إعادة تعيين نموذج التعديل');
}

// حذف أنمي
function deleteAnime(animeId) {
    const anime = animeDB.getAnimeById(animeId);
    if (!anime) return;
    
    if (confirm(`هل أنت متأكد من حذف "${anime.name}"؟`)) {
        try {
            const deleted = animeDB.deleteAnime(animeId);
            if (deleted) {
                displayAnimes();
                updateStats();
                showNotification('تم حذف الأنمي بنجاح', 'success');
            }
        } catch (error) {
            console.error('خطأ في حذف الأنمي:', error);
            showNotification('حدث خطأ أثناء حذف الأنمي', 'error');
        }
    }
}

// تحديث الإحصائيات
function updateStats() {
    const stats = animeDB.getStats();
    
    watchingCount.textContent = stats.watching || 0;
    completedCount.textContent = stats.completed || 0;
    planToWatchCount.textContent = stats.planToWatch || 0;
    ongoingCount.textContent = stats.ongoing || 0;
    finishedCount.textContent = stats.finished || 0;
    notAiredCount.textContent = stats.notAired || 0;
    totalCount.textContent = stats.total || 0;
}

// عرض إشعار
function showNotification(message, type = 'info') {
    // إنشاء عنصر الإشعار
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // إضافة الأنماط
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#48bb78' : type === 'error' ? '#f56565' : '#4299e1'};
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 10px;
        font-weight: 600;
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    
    // إضافة الإشعار للصفحة
    document.body.appendChild(notification);
    
    // تحريك الإشعار للداخل
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // إزالة الإشعار بعد 3 ثوان
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// وظائف إضافية للتصدير والاستيراد
function exportData() {
    const data = animeDB.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `anime-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('تم تصدير البيانات بنجاح', 'success');
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            const success = animeDB.importData(data);
            
            if (success) {
                displayAnimes();
                updateStats();
                showNotification('تم استيراد البيانات بنجاح', 'success');
            } else {
                showNotification('فشل في استيراد البيانات', 'error');
            }
        } catch (error) {
            console.error('خطأ في استيراد البيانات:', error);
            showNotification('ملف غير صالح', 'error');
        }
    };
    reader.readAsText(file);
}

// إضافة أزرار التصدير والاستيراد (اختياري)
function addImportExportButtons() {
    const header = document.querySelector('header');
    const buttonsContainer = document.createElement('div');
    buttonsContainer.style.display = 'flex';
    buttonsContainer.style.gap = '10px';
    
    // زر التصدير
    const exportBtn = document.createElement('button');
    exportBtn.innerHTML = '<i class="fas fa-download"></i> تصدير';
    exportBtn.className = 'add-btn';
    exportBtn.onclick = exportData;
    
    // زر الاستيراد
    const importBtn = document.createElement('button');
    importBtn.innerHTML = '<i class="fas fa-upload"></i> استيراد';
    importBtn.className = 'add-btn';
    
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.style.display = 'none';
    fileInput.onchange = importData;
    
    importBtn.onclick = () => fileInput.click();
    
    buttonsContainer.appendChild(exportBtn);
    buttonsContainer.appendChild(importBtn);
    buttonsContainer.appendChild(fileInput);
    
    header.appendChild(buttonsContainer);
}

// وظائف نظام التقييم بالنجوم
function setupStarRating(starsContainerId, valueDisplayId, hiddenInputId) {
    const starsContainer = document.getElementById(starsContainerId);
    const valueDisplay = document.getElementById(valueDisplayId);
    const hiddenInput = document.getElementById(hiddenInputId);
    
    if (!starsContainer || !valueDisplay || !hiddenInput) return;
    
    const stars = starsContainer.querySelectorAll('.star');
    
    stars.forEach((star, index) => {
        star.addEventListener('click', () => {
            const rating = parseInt(star.dataset.rating);
            setStarRating(starsContainerId, valueDisplayId, hiddenInputId, rating);
        });
        
        star.addEventListener('mouseenter', () => {
            const rating = parseInt(star.dataset.rating);
            highlightStars(starsContainer, rating);
        });
    });
    
    starsContainer.addEventListener('mouseleave', () => {
        const currentRating = parseInt(hiddenInput.value) || 0;
        highlightStars(starsContainer, currentRating);
    });
}

function setStarRating(starsContainerId, valueDisplayId, hiddenInputId, rating) {
    const starsContainer = document.getElementById(starsContainerId);
    const valueDisplay = document.getElementById(valueDisplayId);
    const hiddenInput = document.getElementById(hiddenInputId);
    
    hiddenInput.value = rating;
    valueDisplay.textContent = `${rating}/10`;
    highlightStars(starsContainer, rating);
}

function highlightStars(starsContainer, rating) {
    const stars = starsContainer.querySelectorAll('.star');
    stars.forEach((star, index) => {
        const starRating = parseInt(star.dataset.rating);
        if (starRating <= rating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
}

function resetStarRating(starsContainerId, valueDisplayId) {
    const starsContainer = document.getElementById(starsContainerId);
    const valueDisplay = document.getElementById(valueDisplayId);
    
    if (starsContainer && valueDisplay) {
        const stars = starsContainer.querySelectorAll('.star');
        stars.forEach(star => star.classList.remove('active'));
        valueDisplay.textContent = '0/10';
    }
}

function generateStarsDisplay(rating) {
    let starsHtml = '';
    for (let i = 1; i <= 10; i++) {
        if (i <= rating) {
            starsHtml += '<i class="fas fa-star star-filled"></i>';
        } else {
            starsHtml += '<i class="fas fa-star star-empty"></i>';
        }
    }
    return starsHtml;
}

// تبديل عرض الملاحظات
function toggleNotes(animeId) {
    const notesElement = document.getElementById(`notes-${animeId}`);
    const toggleButton = notesElement.previousElementSibling;
    
    if (notesElement.style.display === 'none') {
        notesElement.style.display = 'block';
        toggleButton.innerHTML = '<i class="fas fa-sticky-note"></i> إخفاء الملاحظات';
    } else {
        notesElement.style.display = 'none';
        toggleButton.innerHTML = '<i class="fas fa-sticky-note"></i> عرض الملاحظات';
    }
}

// وظائف التصنيفات
function getSelectedGenres(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return [];
    
    const checkboxes = container.querySelectorAll('input[type="checkbox"]:checked');
    return Array.from(checkboxes).map(checkbox => checkbox.value);
}

function setSelectedGenres(containerId, genres) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = genres.includes(checkbox.value);
    });
}

function clearSelectedGenres(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
}

// وظائف تحويل النصوص

function getTypeText(type) {
    switch (type) {
        case 'tv': return 'مسلسل';
        case 'movie': return 'فلم';
        case 'ova': return 'OVA';
        case 'ona': return 'ONA';
        case 'special': return 'خاصة';
        default: return type;
    }
}

function getSeasonText(season) {
    switch (season) {
        case 'spring': return 'الربيع';
        case 'summer': return 'الصيف';
        case 'fall': return 'الخريف';
        case 'winter': return 'الشتاء';
        default: return season;
    }
}

// وظائف عرض الصور
function openImageModal(imageSrc, title) {
    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    const modalTitle = document.getElementById('modalImageTitle');
    
    if (imageSrc && imageSrc.trim() !== '') {
        modalImage.src = imageSrc;
        modalTitle.textContent = title || 'صورة الأنمي';
        modal.style.display = 'block';
        
        // إضافة مستمع للإغلاق بالنقر خارج الصورة
        modal.onclick = function(event) {
            if (event.target === modal) {
                closeImageModal();
            }
        };
        
        // إضافة مستمع للإغلاق بمفتاح Escape
        document.addEventListener('keydown', handleEscapeKey);
    }
}

function closeImageModal() {
    const modal = document.getElementById('imageModal');
    modal.style.display = 'none';
    
    // إزالة مستمعي الأحداث
    modal.onclick = null;
    document.removeEventListener('keydown', handleEscapeKey);
}

function handleEscapeKey(event) {
    if (event.key === 'Escape') {
        closeImageModal();
    }
}

// وظائف تصفح الأنميات
function openBrowseModal() {
    const modal = document.getElementById('browseAnimesModal');
    modal.style.display = 'block';
    loadBrowseAnimes();
}

function closeBrowseModal() {
    const modal = document.getElementById('browseAnimesModal');
    modal.style.display = 'none';
    
    // إعادة تعيين الفلاتر
    document.getElementById('browseSearch').value = '';
    document.getElementById('browseStatusFilter').value = '';
    document.getElementById('browseTypeFilter').value = '';
}

function loadBrowseAnimes() {
    const animes = animeDB.getAllAnimes();
    const searchTerm = document.getElementById('browseSearch').value.toLowerCase();
    const statusFilter = document.getElementById('browseStatusFilter').value;
    const typeFilter = document.getElementById('browseTypeFilter').value;
    
    // تطبيق الفلاتر
    const filteredAnimes = animes.filter(anime => {
        const matchesSearch = anime.name.toLowerCase().includes(searchTerm);
        const matchesStatus = !statusFilter || anime.status === statusFilter;
        const matchesType = !typeFilter || anime.type === typeFilter;
        
        return matchesSearch && matchesStatus && matchesType;
    });
    
    displayBrowseAnimes(filteredAnimes);
}

function displayBrowseAnimes(animes) {
    const container = document.getElementById('browseAnimesList');
    
    if (animes.length === 0) {
        container.innerHTML = `
            <div class="browse-empty">
                <i class="fas fa-search"></i>
                <h3>لا توجد نتائج</h3>
                <p>جرب تغيير معايير البحث</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = animes.map(anime => `
        <div class="browse-anime-item" onclick="selectAnimeFromBrowse('${anime.id}')">
            ${anime.image ? 
                `<img src="${anime.image}" alt="${anime.name}" class="browse-anime-image">` :
                `<div class="browse-anime-image"><i class="fas fa-image"></i></div>`
            }
            
            <div class="browse-anime-info">
                <div class="browse-anime-title">${anime.name}</div>
                
                <div class="browse-anime-meta">
                    <span class="browse-meta-tag browse-status-tag">${getStatusText(anime.status)}</span>
                    ${anime.type ? `<span class="browse-meta-tag browse-type-tag">${getTypeText(anime.type)}</span>` : ''}
                </div>
                
                <div class="browse-rating">
                    ${anime.rating > 0 ? 
                        `<span class="stars">${'★'.repeat(Math.floor(anime.rating))}</span> ${anime.rating}/10` :
                        'غير مقيم'
                    }
                </div>
            </div>
        </div>
    `).join('');
}

function selectAnimeFromBrowse(animeId) {
    const anime = animeDB.getAnime(animeId);
    if (anime) {
        // ملء النموذج ببيانات الأنمي المختار
        document.getElementById('animeName').value = anime.name;
        document.getElementById('animeImage').value = anime.image || '';
        document.getElementById('totalEpisodes').value = anime.totalEpisodes || '';
        document.getElementById('watchedEpisodes').value = anime.watchedEpisodes || 0;
        document.getElementById('animeStatus').value = anime.status || 'watching';
        document.getElementById('animeType').value = anime.type || '';
        document.getElementById('animeSeason').value = anime.season || '';
        document.getElementById('animeNotes').value = anime.notes || '';
        
        // تحديث التقييم
        if (anime.rating) {
            setStarRating('starRating', 'ratingValue', 'animeRating', anime.rating);
        }
        
        // تحديث التصنيفات
        if (anime.genres && anime.genres.length > 0) {
            setSelectedGenres('genreCheckboxes', anime.genres);
        }
        
        // إغلاق نافذة التصفح
        closeBrowseModal();
        
        // إظهار رسالة تأكيد
        showNotification('تم تحميل بيانات الأنمي بنجاح!', 'success');
    }
}

// وظائف النسخ الاحتياطي والاستيراد
function exportData() {
    try {
        const data = {
            animes: animeDB.getAllAnimes(),
            exportDate: new Date().toISOString(),
            version: '1.0',
            source: 'Anime List'
        };
        
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `anime-list-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification('تم تصدير البيانات بنجاح!', 'success');
    } catch (error) {
        console.error('خطأ في التصدير:', error);
        showNotification('حدث خطأ أثناء التصدير', 'error');
    }
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            if (data.animes && Array.isArray(data.animes)) {
                // تأكيد الاستيراد
                if (confirm(`هل تريد استيراد ${data.animes.length} أنمي؟ سيتم استبدال البيانات الحالية.`)) {
                    // مسح البيانات الحالية
                    localStorage.removeItem('animeList');
                    
                    // استيراد البيانات الجديدة
                    data.animes.forEach(anime => {
                        animeDB.addAnime(anime);
                    });
                    
                    // تحديث العرض
                    displayAnimes();
                    updateStats();
                    
                    showNotification(`تم استيراد ${data.animes.length} أنمي بنجاح!`, 'success');
                }
            } else {
                showNotification('ملف غير صالح - لا يحتوي على بيانات أنميات', 'error');
            }
        } catch (error) {
            console.error('خطأ في الاستيراد:', error);
            showNotification('خطأ في قراءة الملف - تأكد من أنه ملف JSON صالح', 'error');
        }
    };
    
    reader.readAsText(file);
    event.target.value = ''; // إعادة تعيين input
}

// وظائف استيراد MyAnimeList
function openMalImportModal() {
    const modal = document.getElementById('malImportModal');
    modal.style.display = 'block';
}

function closeMalImportModal() {
    const modal = document.getElementById('malImportModal');
    modal.style.display = 'none';
    
    // إعادة تعيين النموذج
    document.getElementById('malFileInput').value = '';
    document.getElementById('malStartImport').disabled = true;
    document.getElementById('malProgress').style.display = 'none';
}

function setupMalImport() {
    const uploadZone = document.getElementById('malUploadZone');
    const fileInput = document.getElementById('malFileInput');
    const startBtn = document.getElementById('malStartImport');
    
    if (!uploadZone || !fileInput || !startBtn) return;
    
    // إعداد منطقة السحب والإفلات
    uploadZone.addEventListener('click', () => fileInput.click());
    
    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.classList.add('dragover');
    });
    
    uploadZone.addEventListener('dragleave', () => {
        uploadZone.classList.remove('dragover');
    });
    
    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            fileInput.files = files;
            handleMalFileSelect();
        }
    });
    
    fileInput.addEventListener('change', handleMalFileSelect);
    startBtn.addEventListener('click', startMalImport);
}

function handleMalFileSelect() {
    const fileInput = document.getElementById('malFileInput');
    const startBtn = document.getElementById('malStartImport');
    const uploadZone = document.getElementById('malUploadZone');
    
    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        uploadZone.innerHTML = `
            <i class="fas fa-file-alt"></i>
            <h3>ملف محدد: ${file.name}</h3>
            <p>حجم الملف: ${(file.size / 1024).toFixed(1)} KB</p>
        `;
        startBtn.disabled = false;
    }
}

function startMalImport() {
    const fileInput = document.getElementById('malFileInput');
    const mergeData = document.getElementById('malMergeData').checked;
    const importImages = document.getElementById('malImportImages').checked;
    const progressDiv = document.getElementById('malProgress');
    const progressFill = document.getElementById('malProgressFill');
    const progressText = document.getElementById('malProgressText');
    
    if (!fileInput.files.length) return;
    
    const file = fileInput.files[0];
    progressDiv.style.display = 'block';
    progressText.textContent = 'جاري قراءة الملف...';
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const xmlContent = e.target.result;
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
            
            const animeElements = xmlDoc.getElementsByTagName('anime');
            const totalAnimes = animeElements.length;
            
            if (totalAnimes === 0) {
                showNotification('لم يتم العثور على أنميات في الملف', 'error');
                closeMalImportModal();
                return;
            }
            
            progressText.textContent = `تم العثور على ${totalAnimes} أنمي، جاري المعالجة...`;
            
            // مسح البيانات الحالية إذا لم يكن الدمج مفعلاً
            if (!mergeData) {
                localStorage.removeItem('animeList');
            }
            
            let processedCount = 0;
            
            // معالجة كل أنمي
            Array.from(animeElements).forEach((animeElement, index) => {
                setTimeout(() => {
                    const anime = parseMalAnime(animeElement, importImages);
                    if (anime) {
                        animeDB.addAnime(anime);
                    }
                    
                    processedCount++;
                    const progress = (processedCount / totalAnimes) * 100;
                    progressFill.style.width = progress + '%';
                    progressText.textContent = `تمت معالجة ${processedCount} من ${totalAnimes} أنمي...`;
                    
                    if (processedCount === totalAnimes) {
                        // انتهاء المعالجة
                        setTimeout(() => {
                            displayAnimes();
                            updateStats();
                            showNotification(`تم استيراد ${processedCount} أنمي من MyAnimeList بنجاح!`, 'success');
                            closeMalImportModal();
                        }, 500);
                    }
                }, index * 50); // تأخير صغير لتحديث التقدم
            });
            
        } catch (error) {
            console.error('خطأ في معالجة ملف MAL:', error);
            showNotification('خطأ في معالجة ملف MyAnimeList', 'error');
            closeMalImportModal();
        }
    };
    
    reader.readAsText(file);
}

function parseMalAnime(animeElement, importImages = true) {
    try {
        const getElementText = (tagName) => {
            const element = animeElement.getElementsByTagName(tagName)[0];
            return element ? element.textContent.trim() : '';
        };
        
        const name = getElementText('series_title');
        if (!name) return null;
        
        // تحويل حالة MAL إلى حالة التطبيق
        const malStatus = getElementText('my_status');
        let status = 'watching';
        switch (malStatus) {
            case 'Completed': status = 'completed'; break;
            case 'Watching': status = 'watching'; break;
            case 'Plan to Watch': status = 'plan-to-watch'; break;
            case 'On-Hold': status = 'plan-to-watch'; break;
            case 'Dropped': status = 'plan-to-watch'; break;
        }
        
        // تحويل نوع MAL إلى نوع التطبيق
        const malType = getElementText('series_type');
        let type = 'tv';
        switch (malType) {
            case 'TV': type = 'tv'; break;
            case 'Movie': type = 'movie'; break;
            case 'OVA': type = 'ova'; break;
            case 'ONA': type = 'ona'; break;
            case 'Special': type = 'special'; break;
        }
        
        const anime = {
            id: Date.now() + Math.random(),
            name: name,
            image: importImages ? `https://cdn.myanimelist.net/images/anime/${getElementText('series_animedb_id')}.jpg` : '',
            totalEpisodes: parseInt(getElementText('series_episodes')) || 0,
            watchedEpisodes: parseInt(getElementText('my_watched_episodes')) || 0,
            status: status,
            type: type,
            rating: parseInt(getElementText('my_score')) || 0,
            notes: getElementText('my_comments') || '',
            genres: [],
            season: '',
            dateAdded: new Date().toISOString()
        };
        
        return anime;
    } catch (error) {
        console.error('خطأ في معالجة أنمي:', error);
        return null;
    }
}

// تشغيل إضافة أزرار التصدير والاستيراد عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    // إضافة مستمع لزر تصفح الأنميات
    const browseBtn = document.getElementById('browseAnimesBtn');
    if (browseBtn) {
        browseBtn.addEventListener('click', openBrowseModal);
    }
    
    // إضافة مستمعي البحث والفلترة
    const browseSearch = document.getElementById('browseSearch');
    const browseStatusFilter = document.getElementById('browseStatusFilter');
    const browseTypeFilter = document.getElementById('browseTypeFilter');
    
    if (browseSearch) {
        browseSearch.addEventListener('input', loadBrowseAnimes);
    }
    
    if (browseStatusFilter) {
        browseStatusFilter.addEventListener('change', loadBrowseAnimes);
    }
    
    if (browseTypeFilter) {
        browseTypeFilter.addEventListener('change', loadBrowseAnimes);
    }
    
    // إضافة مستمعي أزرار النسخ الاحتياطي
    const exportBtn = document.getElementById('exportBtn');
    const importBtn = document.getElementById('importBtn');
    const malImportBtn = document.getElementById('malImportBtn');
    const importFile = document.getElementById('importFile');
    
    if (exportBtn) {
        exportBtn.addEventListener('click', exportData);
    }
    
    if (importBtn) {
        importBtn.addEventListener('click', () => importFile.click());
    }
    
    if (importFile) {
        importFile.addEventListener('change', importData);
    }
    
    if (malImportBtn) {
        malImportBtn.addEventListener('click', openMalImportModal);
    }
    
    // إعداد نافذة استيراد MAL
    setupMalImport();
});
// نظام إدارة Anime List

// بيانات الإدارة
const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'admin123456'
};

// متغيرات عامة
let isLoggedIn = false;
let currentAdminData = null;

// عناصر DOM
const loginPage = document.getElementById('loginPage');
const adminPanel = document.getElementById('adminPanel');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');

// تهيئة النظام
document.addEventListener('DOMContentLoaded', function() {
    checkAdminSession();
    setupEventListeners();
});

// فحص جلسة الإدارة
function checkAdminSession() {
    const adminSession = localStorage.getItem('adminSession');
    if (adminSession) {
        const sessionData = JSON.parse(adminSession);
        const now = new Date().getTime();
        
        // فحص انتهاء صلاحية الجلسة (24 ساعة)
        if (now - sessionData.timestamp < 24 * 60 * 60 * 1000) {
            loginSuccess(sessionData.username);
            return;
        } else {
            localStorage.removeItem('adminSession');
        }
    }
    
    showLoginPage();
}

// إعداد مستمعي الأحداث
function setupEventListeners() {
    console.log('تم استدعاء setupEventListeners');
    console.log('loginForm:', loginForm);
    
    // تسجيل الدخول
    if (loginForm) {
        console.log('تم إضافة مستمع لنموذج تسجيل الدخول');
        loginForm.addEventListener('submit', handleLogin);
    } else {
        console.error('لم يتم العثور على نموذج تسجيل الدخول');
    }
    
    // تسجيل الخروج
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // أدوات البيانات (فحص الوجود أولاً)
    const exportDataBtn = document.getElementById('exportDataBtn');
    const importDataBtn = document.getElementById('importDataBtn');
    const importFile = document.getElementById('importFile');
    const backupBtn = document.getElementById('backupBtn');
    const restoreBtn = document.getElementById('restoreBtn');
    const clearAllBtn = document.getElementById('clearAllBtn');
    const resetStatsBtn = document.getElementById('resetStatsBtn');
    
    if (exportDataBtn) {
        exportDataBtn.addEventListener('click', exportData);
    }
    if (importDataBtn && importFile) {
        importDataBtn.addEventListener('click', () => importFile.click());
        importFile.addEventListener('change', importData);
    }
    if (backupBtn) {
        backupBtn.addEventListener('click', createBackup);
    }
    if (restoreBtn) {
        restoreBtn.addEventListener('click', restoreBackup);
    }
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', clearAllData);
    }
    if (resetStatsBtn) {
        resetStatsBtn.addEventListener('click', resetStats);
    }
    
    // التقارير
    const generateReportBtn = document.getElementById('generateReportBtn');
    const viewLogsBtn = document.getElementById('viewLogsBtn');
    const addNewAnimeBtn = document.getElementById('addNewAnimeBtn');
    const adminAnimeForm = document.getElementById('adminAnimeForm');
    const adminSearch = document.getElementById('adminSearch');
    
    if (generateReportBtn) {
        generateReportBtn.addEventListener('click', generateReport);
    }
    if (viewLogsBtn) {
        viewLogsBtn.addEventListener('click', viewLogs);
    }
    if (addNewAnimeBtn) {
        addNewAnimeBtn.addEventListener('click', openAdminAddModal);
    }
    if (adminAnimeForm) {
        adminAnimeForm.addEventListener('submit', handleAdminAddAnime);
    }
    if (adminSearch) {
        adminSearch.addEventListener('input', filterTable);
    }
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', filterTable);
    }
    
    // إغلاق النوافذ المنبثقة
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', (e) => {
            e.target.closest('.modal').style.display = 'none';
        });
    });
}

// معالجة تسجيل الدخول
function handleLogin(e) {
    e.preventDefault();
    console.log('تم استدعاء handleLogin');
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    console.log('البيانات المدخلة:', { username, password });
    console.log('البيانات المطلوبة:', ADMIN_CREDENTIALS);
    
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        console.log('تسجيل الدخول نجح');
        loginSuccess(username);
        logActivity('تسجيل دخول المدير', `تم تسجيل دخول المدير ${username} بنجاح`);
    } else {
        console.log('تسجيل الدخول فشل');
        const loginError = document.getElementById('loginError');
        if (loginError) {
            loginError.style.display = 'block';
            setTimeout(() => {
                loginError.style.display = 'none';
            }, 3000);
        }
        logActivity('محاولة دخول فاشلة', `محاولة دخول فاشلة باستخدام اسم المستخدم: ${username}`);
    }
}

// نجح تسجيل الدخول
function loginSuccess(username) {
    isLoggedIn = true;
    currentAdminData = { username };
    
    // حفظ الجلسة
    const sessionData = {
        username: username,
        timestamp: new Date().getTime()
    };
    localStorage.setItem('adminSession', JSON.stringify(sessionData));
    
    // عرض لوحة الإدارة
    loginPage.style.display = 'none';
    adminPanel.style.display = 'block';
    
    // تحديث البيانات
    updateAdminStats();
    loadAnimesTable();
    
    document.getElementById('adminUsername').textContent = username;
}

// عرض صفحة تسجيل الدخول
function showLoginPage() {
    loginPage.style.display = 'flex';
    adminPanel.style.display = 'none';
    isLoggedIn = false;
    currentAdminData = null;
}

// معالجة تسجيل الخروج
function handleLogout() {
    if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
        localStorage.removeItem('adminSession');
        logActivity('تسجيل خروج المدير', `تم تسجيل خروج المدير ${currentAdminData.username}`);
        showLoginPage();
        
        // مسح النماذج
        loginForm.reset();
        loginError.style.display = 'none';
    }
}

// تحديث إحصائيات الإدارة
function updateAdminStats() {
    const stats = animeDB.getStats();
    const animes = animeDB.getAllAnimes();
    
    document.getElementById('totalAnimes').textContent = stats.total;
    document.getElementById('totalEpisodes').textContent = stats.totalEpisodes;
    
    // حساب متوسط التقييم
    const ratedAnimes = animes.filter(anime => anime.rating && anime.rating > 0);
    const avgRating = ratedAnimes.length > 0 
        ? (ratedAnimes.reduce((sum, anime) => sum + anime.rating, 0) / ratedAnimes.length).toFixed(1)
        : '0';
    document.getElementById('avgRating').textContent = avgRating;
    
    // آخر تحديث
    const lastUpdated = animes.length > 0 
        ? new Date(Math.max(...animes.map(anime => new Date(anime.lastUpdated)))).toLocaleDateString('ar-EG')
        : '-';
    document.getElementById('lastUpdate').textContent = lastUpdated;
}

// تحميل جدول الأنميات
function loadAnimesTable() {
    const animes = animeDB.getAllAnimes();
    const tableBody = document.getElementById('animesTableBody');
    
    tableBody.innerHTML = '';
    
    animes.forEach(anime => {
        const row = createTableRow(anime);
        tableBody.appendChild(row);
    });
}

// إنشاء صف في الجدول
function createTableRow(anime) {
    const row = document.createElement('tr');
    const progress = (anime.watchedEpisodes / anime.totalEpisodes) * 100;
    
    row.innerHTML = `
        <td>
            ${anime.image ? 
                `<img src="${anime.image}" alt="${anime.name}" class="table-image" 
                      onclick="openImageModal('${anime.image}', '${anime.name}')"
                      onerror="this.style.display='none'">` :
                '<div class="table-image" style="background: #f0f0f0; display: flex; align-items: center; justify-content: center;"><i class="fas fa-image" style="color: #ccc;"></i></div>'
            }
        </td>
        <td><strong>${anime.name}</strong></td>
        <td><span class="table-status ${getStatusClass(anime.status)}">${getStatusText(anime.status)}</span></td>
        <td>
            <div class="table-progress">
                <div class="table-progress-bar">
                    <div class="table-progress-fill" style="width: ${progress}%"></div>
                </div>
                <span>${anime.watchedEpisodes}/${anime.totalEpisodes}</span>
            </div>
        </td>
        <td>${anime.rating ? `${anime.rating}/10` : '-'}</td>
        <td>
            <div class="table-genres">
                ${anime.genres ? anime.genres.map(genre => `<span class="table-genre-tag">${genre}</span>`).join('') : '-'}
            </div>
        </td>
        <td>${new Date(anime.dateAdded).toLocaleDateString('ar-EG')}</td>
        <td>
            <div class="table-actions">
                <button class="table-action-btn edit-action" onclick="editAnimeFromTable('${anime.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="table-action-btn delete-action" onclick="deleteAnimeFromTable('${anime.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </td>
    `;
    
    return row;
}

// الحصول على فئة الحالة
function getStatusClass(status) {
    switch (status) {
        case 'watching': return 'status-watching';
        case 'completed': return 'status-completed';
        case 'plan-to-watch': return 'status-plan-to-watch';
        default: return '';
    }
}

// الحصول على نص الحالة
function getStatusText(status) {
    switch (status) {
        case 'watching': return 'أشاهدها حالياً';
        case 'completed': return 'مكتمل';
        case 'plan-to-watch': return 'سأكملها لاحقاً';
        case 'ongoing': return 'مستمر';
        case 'not-aired': return 'لم يتم بثه بعد';
        default: return 'غير محدد';
    }
}

// الحصول على نص النوع
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

// فلترة الجدول
function filterTable() {
    const searchTerm = document.getElementById('adminSearch').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    
    let animes = animeDB.getAllAnimes();
    
    // تطبيق البحث
    if (searchTerm) {
        animes = animes.filter(anime => 
            anime.name.toLowerCase().includes(searchTerm) ||
            (anime.genres && anime.genres.some(genre => genre.toLowerCase().includes(searchTerm)))
        );
    }
    
    // تطبيق فلتر الحالة
    if (statusFilter !== 'all') {
        animes = animes.filter(anime => anime.status === statusFilter);
    }
    
    // تحديث الجدول
    const tableBody = document.getElementById('animesTableBody');
    tableBody.innerHTML = '';
    
    animes.forEach(anime => {
        const row = createTableRow(anime);
        tableBody.appendChild(row);
    });
}

// تعديل أنمي من الجدول
function editAnimeFromTable(animeId) {
    // إعادة توجيه إلى الصفحة الرئيسية مع معرف التعديل
    window.open(`index.html?edit=${animeId}`, '_blank');
}

// حذف أنمي من الجدول
function deleteAnimeFromTable(animeId) {
    const anime = animeDB.getAnimeById(animeId);
    if (!anime) return;
    
    if (confirm(`هل أنت متأكد من حذف "${anime.name}"؟`)) {
        const deleted = animeDB.deleteAnime(animeId);
        if (deleted) {
            updateAdminStats();
            loadAnimesTable();
            logActivity('حذف أنمي', `تم حذف الأنمي: ${anime.name}`);
            showAdminNotification('تم حذف الأنمي بنجاح', 'success');
        }
    }
}

// تصدير البيانات
function exportData() {
    try {
        const data = animeDB.exportData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `anime-tracker-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        logActivity('تصدير البيانات', 'تم تصدير جميع البيانات بنجاح');
        showAdminNotification('تم تصدير البيانات بنجاح', 'success');
    } catch (error) {
        console.error('خطأ في تصدير البيانات:', error);
        showAdminNotification('فشل في تصدير البيانات', 'error');
    }
}

// استيراد البيانات
function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            const success = animeDB.importData(data);
            
            if (success) {
                updateAdminStats();
                loadAnimesTable();
                logActivity('استيراد البيانات', `تم استيراد ${data.animes ? data.animes.length : 0} أنمي`);
                showAdminNotification('تم استيراد البيانات بنجاح', 'success');
            } else {
                showAdminNotification('فشل في استيراد البيانات', 'error');
            }
        } catch (error) {
            console.error('خطأ في استيراد البيانات:', error);
            showAdminNotification('ملف غير صالح', 'error');
        }
    };
    reader.readAsText(file);
    
    // إعادة تعيين قيمة الملف
    event.target.value = '';
}

// إنشاء نسخة احتياطية
function createBackup() {
    try {
        const success = animeDB.createBackup();
        if (success) {
            logActivity('إنشاء نسخة احتياطية', 'تم إنشاء نسخة احتياطية محلية');
            showAdminNotification('تم إنشاء النسخة الاحتياطية بنجاح', 'success');
        } else {
            showAdminNotification('فشل في إنشاء النسخة الاحتياطية', 'error');
        }
    } catch (error) {
        console.error('خطأ في إنشاء النسخة الاحتياطية:', error);
        showAdminNotification('فشل في إنشاء النسخة الاحتياطية', 'error');
    }
}

// استعادة النسخة الاحتياطية
function restoreBackup() {
    if (confirm('هل أنت متأكد من استعادة النسخة الاحتياطية؟ سيتم استبدال البيانات الحالية.')) {
        try {
            const success = animeDB.restoreBackup();
            if (success) {
                updateAdminStats();
                loadAnimesTable();
                logActivity('استعادة نسخة احتياطية', 'تم استعادة النسخة الاحتياطية بنجاح');
                showAdminNotification('تم استعادة النسخة الاحتياطية بنجاح', 'success');
            } else {
                showAdminNotification('لا توجد نسخة احتياطية للاستعادة', 'warning');
            }
        } catch (error) {
            console.error('خطأ في استعادة النسخة الاحتياطية:', error);
            showAdminNotification('فشل في استعادة النسخة الاحتياطية', 'error');
        }
    }
}

// مسح جميع البيانات
function clearAllData() {
    if (confirm('تحذير: هذا الإجراء سيحذف جميع البيانات نهائياً. هل أنت متأكد؟')) {
        if (confirm('هذا الإجراء لا يمكن التراجع عنه. اكتب "نعم" للتأكيد:')) {
            try {
                animeDB.clearAllData();
                updateAdminStats();
                loadAnimesTable();
                logActivity('مسح جميع البيانات', 'تم مسح جميع البيانات من قبل المدير');
                showAdminNotification('تم مسح جميع البيانات', 'success');
            } catch (error) {
                console.error('خطأ في مسح البيانات:', error);
                showAdminNotification('فشل في مسح البيانات', 'error');
            }
        }
    }
}

// إعادة تعيين الإحصائيات
function resetStats() {
    if (confirm('هل أنت متأكد من إعادة تعيين الإحصائيات؟')) {
        updateAdminStats();
        logActivity('إعادة تعيين الإحصائيات', 'تم إعادة تعيين الإحصائيات');
        showAdminNotification('تم إعادة تعيين الإحصائيات', 'success');
    }
}

// إنشاء تقرير مفصل
function generateReport() {
    const animes = animeDB.getAllAnimes();
    const stats = animeDB.getStats();
    
    const report = `
# تقرير Anime List المفصل
تاريخ التقرير: ${new Date().toLocaleString('ar-EG')}

## الإحصائيات العامة
- إجمالي الأنميات: ${stats.total}
- أشاهدها حالياً: ${stats.watching}
- تمت مشاهدتها: ${stats.completed}
- سأكملها لاحقاً: ${stats.planToWatch}
- إجمالي الحلقات: ${stats.totalEpisodes}
- الحلقات المشاهدة: ${stats.watchedEpisodes}

## تفاصيل الأنميات
${animes.map(anime => `
### ${anime.name}
- الحالة: ${getStatusText(anime.status)}
- التقدم: ${anime.watchedEpisodes}/${anime.totalEpisodes} (${Math.round((anime.watchedEpisodes/anime.totalEpisodes)*100)}%)
- التقييم: ${anime.rating ? anime.rating + '/10' : 'غير مقيم'}
- التصنيفات: ${anime.genres ? anime.genres.join(', ') : 'غير محدد'}
- تاريخ الإضافة: ${new Date(anime.dateAdded).toLocaleDateString('ar-EG')}
${anime.notes ? '- ملاحظات: ' + anime.notes : ''}
`).join('\n')}

## معلومات إضافية
- متوسط التقييم: ${document.getElementById('avgRating').textContent}/10
- آخر تحديث: ${document.getElementById('lastUpdate').textContent}
- تم إنشاء التقرير بواسطة: ${currentAdminData.username}
    `;
    
    document.getElementById('reportContent').innerHTML = `<pre>${report}</pre>`;
    document.getElementById('reportModal').style.display = 'block';
    
    // إعداد تحميل التقرير
    document.getElementById('downloadReportBtn').onclick = function() {
        const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `anime-tracker-report-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };
    
    logActivity('إنشاء تقرير', 'تم إنشاء تقرير مفصل');
}

// عرض سجل الأنشطة
function viewLogs() {
    const logs = getActivityLogs();
    const logsHtml = logs.map(log => `
        <div style="margin-bottom: 10px; padding: 10px; background: white; border-radius: 5px; border-left: 3px solid #667eea;">
            <strong>${log.timestamp}</strong> - ${log.action}<br>
            <small style="color: #666;">${log.details}</small>
        </div>
    `).join('');
    
    document.getElementById('logsContent').innerHTML = logsHtml || '<p>لا توجد أنشطة مسجلة</p>';
    document.getElementById('logsModal').style.display = 'block';
    
    logActivity('عرض السجل', 'تم عرض سجل الأنشطة');
}

// تسجيل النشاط
function logActivity(action, details) {
    const logs = getActivityLogs();
    const newLog = {
        timestamp: new Date().toLocaleString('ar-EG'),
        action: action,
        details: details,
        user: currentAdminData ? currentAdminData.username : 'غير معروف'
    };
    
    logs.unshift(newLog);
    
    // الاحتفاظ بآخر 100 نشاط فقط
    if (logs.length > 100) {
        logs.splice(100);
    }
    
    localStorage.setItem('adminActivityLogs', JSON.stringify(logs));
}

// الحصول على سجل الأنشطة
function getActivityLogs() {
    try {
        const logs = localStorage.getItem('adminActivityLogs');
        return logs ? JSON.parse(logs) : [];
    } catch (error) {
        console.error('خطأ في قراءة سجل الأنشطة:', error);
        return [];
    }
}

// عرض إشعار الإدارة
function showAdminNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `admin-notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#48bb78' : type === 'error' ? '#f56565' : type === 'warning' ? '#ed8936' : '#4299e1'};
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
        max-width: 400px;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

// فتح نموذج إضافة أنمي جديد
function openAdminAddModal() {
    document.getElementById('adminAddAnimeModal').style.display = 'block';
    
    // إعداد نظام التقييم بالنجوم
    setupStarRating('adminStarRating', 'adminRatingValue', 'adminAnimeRating');
    
    // إعادة تعيين النموذج
    resetAdminForm();
    
    logActivity('فتح نموذج إضافة أنمي', 'تم فتح نموذج إضافة أنمي جديد من لوحة الإدارة');
}

// إغلاق نموذج إضافة الأنمي
function closeAdminAddModal() {
    document.getElementById('adminAddAnimeModal').style.display = 'none';
    resetAdminForm();
}

// إعادة تعيين النموذج
function resetAdminForm() {
    document.getElementById('adminAnimeForm').reset();
    document.getElementById('adminAnimeRating').value = '0';
    document.getElementById('adminRatingValue').textContent = '0/10';
    
    // إعادة تعيين النجوم
    const stars = document.querySelectorAll('#adminStarRating .star');
    stars.forEach(star => star.classList.remove('active'));
    
    // إعادة تعيين التصنيفات
    const checkboxes = document.querySelectorAll('#adminGenreCheckboxes input[type="checkbox"]');
    checkboxes.forEach(checkbox => checkbox.checked = false);
    
    // إعادة تعيين النوع والموسم
    document.getElementById('adminAnimeType').value = '';
    document.getElementById('adminAnimeSeason').value = '';
}

// معالجة إضافة أنمي جديد من الإدارة
function handleAdminAddAnime(e) {
    e.preventDefault();
    
    const animeData = {
        name: document.getElementById('adminAnimeName').value,
        image: document.getElementById('adminAnimeImage').value,
        totalEpisodes: document.getElementById('adminTotalEpisodes').value,
        watchedEpisodes: document.getElementById('adminWatchedEpisodes').value,
        status: document.getElementById('adminAnimeStatus').value,
        rating: document.getElementById('adminAnimeRating').value,
        notes: document.getElementById('adminAnimeNotes').value,
        genres: getSelectedGenresAdmin('adminGenreCheckboxes'),
        type: document.getElementById('adminAnimeType').value,
        season: document.getElementById('adminAnimeSeason').value
    };

    // التحقق من صحة البيانات
    if (!animeData.name.trim()) {
        showAdminNotification('يرجى إدخال اسم الأنمي', 'error');
        return;
    }

    if (!animeData.totalEpisodes || animeData.totalEpisodes < 1) {
        showAdminNotification('يرجى إدخال عدد صحيح للحلقات', 'error');
        return;
    }

    if (parseInt(animeData.watchedEpisodes) > parseInt(animeData.totalEpisodes)) {
        showAdminNotification('عدد الحلقات المشاهدة لا يمكن أن يكون أكبر من العدد الكلي', 'error');
        return;
    }

    try {
        const newAnime = animeDB.addAnime(animeData);
        if (newAnime) {
            updateAdminStats();
            loadAnimesTable();
            closeAdminAddModal();
            logActivity('إضافة أنمي جديد', `تم إضافة الأنمي: ${animeData.name} من لوحة الإدارة`);
            showAdminNotification('تم إضافة الأنمي بنجاح!', 'success');
        }
    } catch (error) {
        console.error('خطأ في إضافة الأنمي:', error);
        showAdminNotification('حدث خطأ أثناء إضافة الأنمي', 'error');
    }
}

// الحصول على التصنيفات المحددة في الإدارة
function getSelectedGenresAdmin(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return [];
    
    const checkboxes = container.querySelectorAll('input[type="checkbox"]:checked');
    return Array.from(checkboxes).map(checkbox => checkbox.value);
}

// إعداد نظام التقييم بالنجوم (نسخة للإدارة)
function setupStarRating(starsContainerId, valueDisplayId, hiddenInputId) {
    const starsContainer = document.getElementById(starsContainerId);
    const valueDisplay = document.getElementById(valueDisplayId);
    const hiddenInput = document.getElementById(hiddenInputId);
    
    if (!starsContainer || !valueDisplay || !hiddenInput) return;
    
    const stars = starsContainer.querySelectorAll('.star');
    
    stars.forEach((star, index) => {
        star.addEventListener('click', () => {
            const rating = parseInt(star.dataset.rating);
            setStarRatingAdmin(starsContainerId, valueDisplayId, hiddenInputId, rating);
        });
        
        star.addEventListener('mouseenter', () => {
            const rating = parseInt(star.dataset.rating);
            highlightStarsAdmin(starsContainer, rating);
        });
    });
    
    starsContainer.addEventListener('mouseleave', () => {
        const currentRating = parseInt(hiddenInput.value) || 0;
        highlightStarsAdmin(starsContainer, currentRating);
    });
}

function setStarRatingAdmin(starsContainerId, valueDisplayId, hiddenInputId, rating) {
    const starsContainer = document.getElementById(starsContainerId);
    const valueDisplay = document.getElementById(valueDisplayId);
    const hiddenInput = document.getElementById(hiddenInputId);
    
    hiddenInput.value = rating;
    valueDisplay.textContent = `${rating}/10`;
    highlightStarsAdmin(starsContainer, rating);
}

function highlightStarsAdmin(starsContainer, rating) {
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

// تحديث تلقائي للحالة عند تغيير عدد الحلقات المشاهدة
document.addEventListener('DOMContentLoaded', function() {
    const watchedInput = document.getElementById('adminWatchedEpisodes');
    const totalInput = document.getElementById('adminTotalEpisodes');
    const statusSelect = document.getElementById('adminAnimeStatus');
    
    if (watchedInput && totalInput && statusSelect) {
        watchedInput.addEventListener('input', function() {
            const totalEpisodes = parseInt(totalInput.value) || 0;
            const watchedEpisodes = parseInt(this.value) || 0;
            
            if (watchedEpisodes >= totalEpisodes && totalEpisodes > 0) {
                statusSelect.value = 'completed';
            }
        });
    }
    
    // إضافة مستمع لزر تصفح الأنميات في لوحة الإدارة
    const adminBrowseBtn = document.getElementById('adminBrowseAnimesBtn');
    if (adminBrowseBtn) {
        adminBrowseBtn.addEventListener('click', openAdminBrowseModal);
    }
    
    // إضافة مستمعي البحث والفلترة في لوحة الإدارة
    const adminBrowseSearch = document.getElementById('adminBrowseSearch');
    const adminBrowseStatusFilter = document.getElementById('adminBrowseStatusFilter');
    const adminBrowseTypeFilter = document.getElementById('adminBrowseTypeFilter');
    
    if (adminBrowseSearch) {
        adminBrowseSearch.addEventListener('input', loadAdminBrowseAnimes);
    }
    
    if (adminBrowseStatusFilter) {
        adminBrowseStatusFilter.addEventListener('change', loadAdminBrowseAnimes);
    }
    
    if (adminBrowseTypeFilter) {
        adminBrowseTypeFilter.addEventListener('change', loadAdminBrowseAnimes);
    }
    
    // إضافة مستمع لزر عرض الموقع
    const viewSiteBtn = document.getElementById('viewSiteBtn');
    if (viewSiteBtn) {
        viewSiteBtn.addEventListener('click', function() {
            // فتح الصفحة الرئيسية في نافذة جديدة
            window.open('index.html', '_blank');
        });
    }
});

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

// وظائف تصفح الأنميات في لوحة الإدارة
function openAdminBrowseModal() {
    const modal = document.getElementById('adminBrowseAnimesModal');
    modal.style.display = 'block';
    loadAdminBrowseAnimes();
}

function closeAdminBrowseModal() {
    const modal = document.getElementById('adminBrowseAnimesModal');
    modal.style.display = 'none';
    
    // إعادة تعيين الفلاتر
    document.getElementById('adminBrowseSearch').value = '';
    document.getElementById('adminBrowseStatusFilter').value = '';
    document.getElementById('adminBrowseTypeFilter').value = '';
}

function loadAdminBrowseAnimes() {
    const animes = animeDB.getAllAnimes();
    const searchTerm = document.getElementById('adminBrowseSearch').value.toLowerCase();
    const statusFilter = document.getElementById('adminBrowseStatusFilter').value;
    const typeFilter = document.getElementById('adminBrowseTypeFilter').value;
    
    // تطبيق الفلاتر
    const filteredAnimes = animes.filter(anime => {
        const matchesSearch = anime.name.toLowerCase().includes(searchTerm);
        const matchesStatus = !statusFilter || anime.status === statusFilter;
        const matchesType = !typeFilter || anime.type === typeFilter;
        
        return matchesSearch && matchesStatus && matchesType;
    });
    
    displayAdminBrowseAnimes(filteredAnimes);
}

function displayAdminBrowseAnimes(animes) {
    const container = document.getElementById('adminBrowseAnimesList');
    
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
        <div class="browse-anime-item" onclick="selectAnimeFromAdminBrowse('${anime.id}')">
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

function selectAnimeFromAdminBrowse(animeId) {
    const anime = animeDB.getAnime(animeId);
    if (anime) {
        // ملء النموذج ببيانات الأنمي المختار
        document.getElementById('adminAnimeName').value = anime.name;
        document.getElementById('adminAnimeImage').value = anime.image || '';
        document.getElementById('adminTotalEpisodes').value = anime.totalEpisodes || '';
        document.getElementById('adminWatchedEpisodes').value = anime.watchedEpisodes || 0;
        document.getElementById('adminAnimeStatus').value = anime.status || 'watching';
        document.getElementById('adminAnimeType').value = anime.type || '';
        document.getElementById('adminAnimeSeason').value = anime.season || '';
        document.getElementById('adminAnimeNotes').value = anime.notes || '';
        
        // تحديث التقييم
        if (anime.rating) {
            setAdminStarRating(anime.rating);
        }
        
        // تحديث التصنيفات
        if (anime.genres && anime.genres.length > 0) {
            setSelectedGenresAdmin('adminGenreCheckboxes', anime.genres);
        }
        
        // إغلاق نافذة التصفح
        closeAdminBrowseModal();
        
        // إظهار رسالة تأكيد
        showAdminNotification('تم تحميل بيانات الأنمي بنجاح!', 'success');
    }
}

// إغلاق النوافذ عند النقر خارجها
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
    }
});

// فحص الجلسة المحفوظة
function checkSession() {
    const savedSession = localStorage.getItem('adminSession');
    if (savedSession) {
        try {
            const sessionData = JSON.parse(savedSession);
            const now = new Date().getTime();
            
            // فحص انتهاء صلاحية الجلسة (24 ساعة)
            if (now - sessionData.timestamp < 24 * 60 * 60 * 1000) {
                loginSuccess(sessionData.username);
                return;
            } else {
                // انتهت صلاحية الجلسة
                localStorage.removeItem('adminSession');
            }
        } catch (error) {
            console.error('خطأ في قراءة الجلسة:', error);
            localStorage.removeItem('adminSession');
        }
    }
    
    // إظهار صفحة تسجيل الدخول
    showLoginPage();
}

// تشغيل التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    console.log('تم تحميل الصفحة');
    setupEventListeners();
    checkSession();
});
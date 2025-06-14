// قاعدة البيانات المحلية باستخدام localStorage
class AnimeDatabase {
    constructor() {
        this.storageKey = 'animeTracker';
        this.animes = this.loadFromStorage();
    }

    // تحميل البيانات من localStorage
    loadFromStorage() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('خطأ في تحميل البيانات:', error);
            return [];
        }
    }

    // حفظ البيانات في localStorage
    saveToStorage() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.animes));
            return true;
        } catch (error) {
            console.error('خطأ في حفظ البيانات:', error);
            return false;
        }
    }

    // التحقق من وجود أنمي مكرر
    checkDuplicate(animeName) {
        const normalizedName = animeName.trim().toLowerCase();
        return this.animes.find(anime => 
            anime.name.trim().toLowerCase() === normalizedName
        );
    }

    // التحقق من التشابه في الأسماء
    findSimilarAnimes(animeName, threshold = 0.8) {
        const normalizedName = animeName.trim().toLowerCase();
        const similarAnimes = [];
        
        this.animes.forEach(anime => {
            const existingName = anime.name.trim().toLowerCase();
            const similarity = this.calculateSimilarity(normalizedName, existingName);
            
            if (similarity >= threshold && similarity < 1) {
                similarAnimes.push({
                    anime: anime,
                    similarity: similarity
                });
            }
        });
        
        return similarAnimes.sort((a, b) => b.similarity - a.similarity);
    }

    // حساب التشابه بين نصين
    calculateSimilarity(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        
        if (longer.length === 0) return 1.0;
        
        const distance = this.levenshteinDistance(longer, shorter);
        return (longer.length - distance) / longer.length;
    }

    // حساب مسافة Levenshtein
    levenshteinDistance(str1, str2) {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }

    // إضافة أنمي جديد
    addAnime(animeData) {
        const newAnime = {
            id: this.generateId(),
            name: animeData.name,
            image: animeData.image || '',
            totalEpisodes: parseInt(animeData.totalEpisodes),
            watchedEpisodes: parseInt(animeData.watchedEpisodes) || 0,
            status: animeData.status,
            rating: parseFloat(animeData.rating) || null,
            notes: animeData.notes || '',
            genres: animeData.genres || [],
            dateAdded: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
        };

        // التأكد من أن عدد الحلقات المشاهدة لا يتجاوز العدد الكلي
        if (newAnime.watchedEpisodes > newAnime.totalEpisodes) {
            newAnime.watchedEpisodes = newAnime.totalEpisodes;
        }

        // تحديث الحالة تلقائياً إذا تمت مشاهدة جميع الحلقات
        if (newAnime.watchedEpisodes === newAnime.totalEpisodes && newAnime.status !== 'completed') {
            newAnime.status = 'completed';
        }

        this.animes.push(newAnime);
        this.saveToStorage();
        return newAnime;
    }

    // تحديث أنمي موجود
    updateAnime(id, updateData) {
        const index = this.animes.findIndex(anime => anime.id === id);
        if (index === -1) return null;

        const anime = this.animes[index];
        
        // تحديث البيانات
        if (updateData.name !== undefined) anime.name = updateData.name;
        if (updateData.image !== undefined) anime.image = updateData.image;
        if (updateData.totalEpisodes !== undefined) anime.totalEpisodes = parseInt(updateData.totalEpisodes);
        if (updateData.watchedEpisodes !== undefined) anime.watchedEpisodes = parseInt(updateData.watchedEpisodes);
        if (updateData.status !== undefined) anime.status = updateData.status;
        if (updateData.rating !== undefined) anime.rating = parseFloat(updateData.rating) || null;
        if (updateData.notes !== undefined) anime.notes = updateData.notes;
        if (updateData.genres !== undefined) anime.genres = updateData.genres;

        // التأكد من أن عدد الحلقات المشاهدة لا يتجاوز العدد الكلي
        if (anime.watchedEpisodes > anime.totalEpisodes) {
            anime.watchedEpisodes = anime.totalEpisodes;
        }

        // تحديث الحالة تلقائياً إذا تمت مشاهدة جميع الحلقات
        if (anime.watchedEpisodes === anime.totalEpisodes && anime.status !== 'completed') {
            anime.status = 'completed';
        }

        anime.lastUpdated = new Date().toISOString();
        this.saveToStorage();
        return anime;
    }

    // حذف أنمي
    deleteAnime(id) {
        const index = this.animes.findIndex(anime => anime.id === id);
        if (index === -1) return false;

        this.animes.splice(index, 1);
        this.saveToStorage();
        return true;
    }

    // الحصول على أنمي بواسطة ID
    getAnimeById(id) {
        return this.animes.find(anime => anime.id === id) || null;
    }

    // الحصول على جميع الأنميات
    getAllAnimes() {
        return [...this.animes];
    }

    // فلترة الأنميات حسب الحالة
    getAnimesByStatus(status) {
        return this.animes.filter(anime => anime.status === status);
    }

    // البحث في الأنميات
    searchAnimes(query) {
        const searchTerm = query.toLowerCase().trim();
        if (!searchTerm) return this.getAllAnimes();

        return this.animes.filter(anime => 
            anime.name.toLowerCase().includes(searchTerm)
        );
    }

    // زيادة عدد الحلقات المشاهدة
    incrementWatchedEpisodes(id) {
        const anime = this.getAnimeById(id);
        if (!anime) return null;

        if (anime.watchedEpisodes < anime.totalEpisodes) {
            anime.watchedEpisodes++;
            
            // تحديث الحالة إذا تمت مشاهدة جميع الحلقات
            if (anime.watchedEpisodes === anime.totalEpisodes) {
                anime.status = 'completed';
            }
            
            anime.lastUpdated = new Date().toISOString();
            this.saveToStorage();
        }
        
        return anime;
    }

    // الحصول على إحصائيات
    getStats() {
        const stats = {
            total: this.animes.length,
            watching: 0,
            completed: 0,
            planToWatch: 0,
            ongoing: 0,
            finished: 0,
            notAired: 0,
            totalEpisodes: 0,
            watchedEpisodes: 0
        };

        this.animes.forEach(anime => {
            switch (anime.status) {
                case 'watching':
                    stats.watching++;
                    break;
                case 'completed':
                    stats.completed++;
                    break;
                case 'plan-to-watch':
                    stats.planToWatch++;
                    break;
                case 'ongoing':
                    stats.ongoing++;
                    break;
                case 'finished':
                    stats.finished++;
                    break;
                case 'not-aired':
                    stats.notAired++;
                    break;
            }
            
            stats.totalEpisodes += anime.totalEpisodes;
            stats.watchedEpisodes += anime.watchedEpisodes;
        });

        return stats;
    }

    // ترتيب الأنميات
    sortAnimes(sortBy = 'dateAdded', order = 'desc') {
        return [...this.animes].sort((a, b) => {
            let valueA, valueB;
            
            switch (sortBy) {
                case 'name':
                    valueA = a.name.toLowerCase();
                    valueB = b.name.toLowerCase();
                    break;
                case 'rating':
                    valueA = a.rating || 0;
                    valueB = b.rating || 0;
                    break;
                case 'progress':
                    valueA = a.watchedEpisodes / a.totalEpisodes;
                    valueB = b.watchedEpisodes / b.totalEpisodes;
                    break;
                case 'dateAdded':
                default:
                    valueA = new Date(a.dateAdded);
                    valueB = new Date(b.dateAdded);
                    break;
            }
            
            if (order === 'asc') {
                return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
            } else {
                return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
            }
        });
    }

    // توليد ID فريد
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // تصدير البيانات
    exportData() {
        return {
            version: '1.0',
            exportDate: new Date().toISOString(),
            animes: this.animes
        };
    }

    // استيراد البيانات
    importData(data) {
        try {
            if (data.animes && Array.isArray(data.animes)) {
                this.animes = data.animes;
                this.saveToStorage();
                return true;
            }
            return false;
        } catch (error) {
            console.error('خطأ في استيراد البيانات:', error);
            return false;
        }
    }

    // مسح جميع البيانات
    clearAllData() {
        this.animes = [];
        this.saveToStorage();
        return true;
    }

    // إنشاء نسخة احتياطية
    createBackup() {
        try {
            const backupData = {
                animes: this.animes,
                timestamp: new Date().toISOString(),
                version: '1.0'
            };
            localStorage.setItem(this.storageKey + '_backup', JSON.stringify(backupData));
            return true;
        } catch (error) {
            console.error('خطأ في إنشاء النسخة الاحتياطية:', error);
            return false;
        }
    }

    // استعادة النسخة الاحتياطية
    restoreBackup() {
        try {
            const backupData = localStorage.getItem(this.storageKey + '_backup');
            if (!backupData) {
                return false;
            }

            const parsedData = JSON.parse(backupData);
            if (parsedData.animes && Array.isArray(parsedData.animes)) {
                this.animes = parsedData.animes;
                this.saveToStorage();
                return true;
            }
            return false;
        } catch (error) {
            console.error('خطأ في استعادة النسخة الاحتياطية:', error);
            return false;
        }
    }
}

// إنشاء مثيل من قاعدة البيانات
const animeDB = new AnimeDatabase();
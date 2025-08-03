// Main Application Controller
import { AuthManager } from './auth.js';
import { ExamManager } from './exam.js';
import { AdminManager } from './admin.js';
import { ThemeManager } from './theme.js';
import { UIManager } from './ui.js';

class App {
    constructor() {
        this.auth = new AuthManager(this);
        this.exam = new ExamManager(this);
        this.admin = new AdminManager(this);
        this.theme = new ThemeManager();
        this.ui = new UIManager();
        
        this.currentUser = null;
        this.currentPage = 'auth';
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAuthState();
        this.hideLoadingScreen();
    }

    setupEventListeners() {
        // Navigation
        document.getElementById('nav-dashboard')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showDashboard();
        });

        document.getElementById('nav-admin')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showAdminDashboard();
        });

        document.getElementById('logout-btn')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.logout();
        });

        // Theme toggle
        document.getElementById('theme-toggle')?.addEventListener('click', () => {
            this.theme.toggle();
        });
    }

    hideLoadingScreen() {
        setTimeout(() => {
            document.getElementById('loading-screen').style.display = 'none';
            document.getElementById('main-content').style.display = 'block';
        }, 1000);
    }

    checkAuthState() {
        const user = localStorage.getItem('currentUser');
        if (user) {
            this.currentUser = JSON.parse(user);
            this.showDashboard();
        } else {
            this.showAuth();
        }
    }

    showAuth() {
        this.currentPage = 'auth';
        this.hideAllPages();
        document.getElementById('auth-page').style.display = 'block';
        document.getElementById('navbar').style.display = 'none';
    }

    showDashboard() {
        this.currentPage = 'dashboard';
        this.hideAllPages();
        document.getElementById('navbar').style.display = 'block';
        
        if (this.currentUser?.role === 'admin') {
            document.getElementById('nav-admin-link').style.display = 'block';
            document.getElementById('admin-dashboard').style.display = 'block';
            this.admin.loadAdminDashboard();
        } else {
            document.getElementById('student-dashboard').style.display = 'block';
            this.loadStudentDashboard();
        }
        
        document.getElementById('user-name').textContent = this.currentUser?.name || 'کاربر';
    }

    showAdminDashboard() {
        if (this.currentUser?.role !== 'admin') return;
        
        this.currentPage = 'admin';
        this.hideAllPages();
        document.getElementById('admin-dashboard').style.display = 'block';
        this.admin.loadAdminDashboard();
    }

    showExamInterface(examId) {
        this.currentPage = 'exam';
        this.hideAllPages();
        document.getElementById('exam-interface').style.display = 'block';
        this.exam.startExam(examId);
    }

    hideAllPages() {
        const pages = [
            'auth-page',
            'student-dashboard', 
            'admin-dashboard',
            'exam-interface'
        ];
        
        pages.forEach(pageId => {
            const page = document.getElementById(pageId);
            if (page) page.style.display = 'none';
        });
    }

    loadStudentDashboard() {
        const exams = this.getExams();
        const userResults = this.getUserResults();
        
        // Update stats
        document.getElementById('total-exams').textContent = exams.length;
        document.getElementById('completed-exams').textContent = userResults.length;
        document.getElementById('pending-exams').textContent = exams.filter(exam => 
            !userResults.some(result => result.examId === exam.id)
        ).length;
        
        const avgScore = userResults.length > 0 
            ? Math.round(userResults.reduce((sum, result) => sum + result.score, 0) / userResults.length)
            : 0;
        document.getElementById('average-score').textContent = `${avgScore}%`;
        
        // Load available exams
        this.loadAvailableExams();
        this.loadRecentResults();
    }

    loadAvailableExams() {
        const container = document.getElementById('available-exams');
        const exams = this.getExams();
        const userResults = this.getUserResults();
        
        if (exams.length === 0) {
            container.innerHTML = this.ui.createEmptyState(
                'clipboard-list',
                'هیچ آزمونی موجود نیست',
                'در حال حاضر آزمونی برای شرکت وجود ندارد.'
            );
            return;
        }
        
        container.innerHTML = exams.map(exam => {
            const hasCompleted = userResults.some(result => result.examId === exam.id);
            const status = hasCompleted ? 'completed' : 'available';
            const statusText = hasCompleted ? 'تکمیل شده' : 'موجود';
            
            return `
                <div class="exam-item fade-in">
                    <div class="exam-header">
                        <h4 class="exam-title">${exam.title}</h4>
                        <span class="exam-status ${status}">${statusText}</span>
                    </div>
                    <div class="exam-meta">
                        <div class="exam-meta-item">
                            <i class="fas fa-clock"></i>
                            <span>${exam.duration} دقیقه</span>
                        </div>
                        <div class="exam-meta-item">
                            <i class="fas fa-question-circle"></i>
                            <span>${exam.questions?.length || 0} سوال</span>
                        </div>
                        <div class="exam-meta-item">
                            <i class="fas fa-star"></i>
                            <span>${exam.totalMarks} نمره</span>
                        </div>
                    </div>
                    <p class="exam-description">${exam.description}</p>
                    <div class="exam-actions">
                        ${!hasCompleted ? 
                            `<button class="btn btn-primary start-exam-btn" data-exam-id="${exam.id}">
                                <i class="fas fa-play me-2"></i>شروع آزمون
                            </button>` : 
                            `<button class="btn btn-outline-primary view-result-btn" data-exam-id="${exam.id}">
                                <i class="fas fa-chart-line me-2"></i>مشاهده نتیجه
                            </button>`
                        }
                    </div>
                </div>
            `;
        }).join('');
        
        // Add event listeners
        container.querySelectorAll('.start-exam-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const examId = e.target.closest('button').dataset.examId;
                this.showExamInterface(examId);
            });
        });
        
        container.querySelectorAll('.view-result-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const examId = e.target.closest('button').dataset.examId;
                this.exam.showResults(examId);
            });
        });
    }

    loadRecentResults() {
        const container = document.getElementById('recent-results');
        const results = this.getUserResults().slice(-5).reverse();
        
        if (results.length === 0) {
            container.innerHTML = this.ui.createEmptyState(
                'chart-line',
                'هیچ نتیجه‌ای موجود نیست',
                'هنوز در هیچ آزمونی شرکت نکرده‌اید.'
            );
            return;
        }
        
        container.innerHTML = results.map(result => {
            const exam = this.getExams().find(e => e.id === result.examId);
            const scoreClass = result.score >= 80 ? 'high' : result.score >= 60 ? 'medium' : 'low';
            
            return `
                <div class="result-item fade-in">
                    <div class="result-header">
                        <h5 class="result-title">${exam?.title || 'آزمون حذف شده'}</h5>
                        <span class="result-score ${scoreClass}">${result.score}%</span>
                    </div>
                    <div class="result-meta">
                        <div class="result-meta-item">
                            <i class="fas fa-calendar"></i>
                            <span>${new Date(result.completedAt).toLocaleDateString('fa-IR')}</span>
                        </div>
                        <div class="result-meta-item">
                            <i class="fas fa-clock"></i>
                            <span>${result.timeSpent} دقیقه</span>
                        </div>
                        <div class="result-meta-item">
                            <i class="fas fa-check-circle"></i>
                            <span>${result.correctAnswers} از ${result.totalQuestions} صحیح</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    getExams() {
        return JSON.parse(localStorage.getItem('exams') || '[]');
    }

    getUserResults() {
        const userId = this.currentUser?.id;
        if (!userId) return [];
        
        const allResults = JSON.parse(localStorage.getItem('examResults') || '[]');
        return allResults.filter(result => result.userId === userId);
    }

    login(user) {
        this.currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.showDashboard();
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        this.showAuth();
    }

    showNotification(message, type = 'info') {
        this.ui.showNotification(message, type);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
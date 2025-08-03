// Authentication Manager
export class AuthManager {
    constructor(app) {
        this.app = app;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeDefaultUsers();
    }

    setupEventListeners() {
        // Login form
        document.getElementById('login-form-element')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Register form
        document.getElementById('register-form-element')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });

        // Toggle between login and register
        document.getElementById('show-register')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showRegisterForm();
        });

        document.getElementById('show-login')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showLoginForm();
        });
    }

    initializeDefaultUsers() {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        
        if (users.length === 0) {
            const defaultUsers = [
                {
                    id: 'admin-1',
                    name: 'مدیر سیستم',
                    email: 'admin@test.com',
                    password: 'admin123',
                    role: 'admin'
                },
                {
                    id: 'student-1',
                    name: 'علی احمدی',
                    email: 'student@test.com',
                    password: 'student123',
                    role: 'student'
                }
            ];
            
            localStorage.setItem('users', JSON.stringify(defaultUsers));
        }
    }

    async handleLogin() {
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;

        // Clear previous errors
        this.clearErrors();

        // Validation
        if (!email || !password) {
            this.showError('login-form-element', 'لطفاً تمام فیلدها را پر کنید.');
            return;
        }

        if (!this.isValidEmail(email)) {
            this.showError('login-form-element', 'فرمت ایمیل صحیح نیست.');
            return;
        }

        // Find user
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find(u => u.email === email && u.password === password);

        if (!user) {
            this.showError('login-form-element', 'ایمیل یا رمز عبور اشتباه است.');
            return;
        }

        // Success
        this.showSuccess('login-form-element', 'ورود موفقیت‌آمیز بود...');
        
        setTimeout(() => {
            this.app.login(user);
        }, 1000);
    }

    async handleRegister() {
        const name = document.getElementById('register-name').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;
        const role = document.getElementById('register-role').value;

        // Clear previous errors
        this.clearErrors();

        // Validation
        if (!name || !email || !password || !confirmPassword || !role) {
            this.showError('register-form-element', 'لطفاً تمام فیلدها را پر کنید.');
            return;
        }

        if (!this.isValidEmail(email)) {
            this.showError('register-form-element', 'فرمت ایمیل صحیح نیست.');
            return;
        }

        if (password.length < 6) {
            this.showError('register-form-element', 'رمز عبور باید حداقل ۶ کاراکتر باشد.');
            return;
        }

        if (password !== confirmPassword) {
            this.showError('register-form-element', 'رمز عبور و تکرار آن مطابقت ندارند.');
            return;
        }

        // Check if user exists
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        if (users.some(u => u.email === email)) {
            this.showError('register-form-element', 'کاربری با این ایمیل قبلاً ثبت نام کرده است.');
            return;
        }

        // Create new user
        const newUser = {
            id: `${role}-${Date.now()}`,
            name,
            email,
            password,
            role,
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));

        this.showSuccess('register-form-element', 'ثبت نام با موفقیت انجام شد...');
        
        setTimeout(() => {
            this.app.login(newUser);
        }, 1000);
    }

    showLoginForm() {
        document.getElementById('login-form').style.display = 'block';
        document.getElementById('register-form').style.display = 'none';
        this.clearErrors();
    }

    showRegisterForm() {
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('register-form').style.display = 'block';
        this.clearErrors();
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    showError(formId, message) {
        const form = document.getElementById(formId);
        let errorDiv = form.querySelector('.error-message');
        
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            form.appendChild(errorDiv);
        }
        
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }

    showSuccess(formId, message) {
        const form = document.getElementById(formId);
        let successDiv = form.querySelector('.success-message');
        
        if (!successDiv) {
            successDiv = document.createElement('div');
            successDiv.className = 'success-message';
            form.appendChild(successDiv);
        }
        
        successDiv.textContent = message;
        successDiv.style.display = 'block';
    }

    clearErrors() {
        document.querySelectorAll('.error-message, .success-message').forEach(el => {
            el.style.display = 'none';
        });
    }
}
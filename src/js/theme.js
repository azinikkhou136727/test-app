// Theme Manager
export class ThemeManager {
    constructor() {
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.init();
    }

    init() {
        this.applyTheme(this.currentTheme);
        this.updateThemeIcon();
    }

    toggle() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(this.currentTheme);
        this.updateThemeIcon();
        localStorage.setItem('theme', this.currentTheme);
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        
        // Update Bootstrap classes for dark mode
        if (theme === 'dark') {
            document.body.classList.add('bg-dark', 'text-light');
            this.updateBootstrapClasses('dark');
        } else {
            document.body.classList.remove('bg-dark', 'text-light');
            this.updateBootstrapClasses('light');
        }
    }

    updateBootstrapClasses(theme) {
        // Update navbar
        const navbar = document.getElementById('navbar');
        if (navbar) {
            if (theme === 'dark') {
                navbar.classList.remove('navbar-light', 'bg-white');
                navbar.classList.add('navbar-dark', 'bg-dark');
            } else {
                navbar.classList.remove('navbar-dark', 'bg-dark');
                navbar.classList.add('navbar-light', 'bg-white');
            }
        }

        // Update modals
        document.querySelectorAll('.modal-content').forEach(modal => {
            if (theme === 'dark') {
                modal.classList.add('bg-dark', 'text-light');
            } else {
                modal.classList.remove('bg-dark', 'text-light');
            }
        });
    }

    updateThemeIcon() {
        const icon = document.getElementById('theme-icon');
        if (icon) {
            icon.className = this.currentTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
        }
    }
}
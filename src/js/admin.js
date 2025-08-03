// Admin Management
export class AdminManager {
    constructor(app) {
        this.app = app;
        this.currentEditingExam = null;
        this.questionCounter = 0;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Create exam button
        document.getElementById('create-exam-btn')?.addEventListener('click', () => {
            this.openExamModal();
        });

        // Save exam button
        document.getElementById('save-exam-btn')?.addEventListener('click', () => {
            this.saveExam();
        });

        // Add question button
        document.getElementById('add-question-btn')?.addEventListener('click', () => {
            this.addQuestion();
        });
    }

    loadAdminDashboard() {
        this.updateAdminStats();
        this.loadAdminExams();
    }

    updateAdminStats() {
        const exams = JSON.parse(localStorage.getItem('exams') || '[]');
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const results = JSON.parse(localStorage.getItem('examResults') || '[]');
        
        const students = users.filter(u => u.role === 'student');
        const avgScore = results.length > 0 
            ? Math.round(results.reduce((sum, result) => sum + result.score, 0) / results.length)
            : 0;

        document.getElementById('admin-total-exams').textContent = exams.length;
        document.getElementById('admin-total-students').textContent = students.length;
        document.getElementById('admin-submissions').textContent = results.length;
        document.getElementById('admin-avg-score').textContent = `${avgScore}%`;
    }

    loadAdminExams() {
        const container = document.getElementById('admin-exams-list');
        const exams = JSON.parse(localStorage.getItem('exams') || '[]');
        const results = JSON.parse(localStorage.getItem('examResults') || '[]');
        
        if (exams.length === 0) {
            container.innerHTML = this.app.ui.createEmptyState(
                'clipboard-list',
                'هیچ آزمونی ایجاد نشده',
                'برای شروع، آزمون جدیدی ایجاد کنید.'
            );
            return;
        }
        
        container.innerHTML = exams.map(exam => {
            const examResults = results.filter(r => r.examId === exam.id);
            const avgScore = examResults.length > 0 
                ? Math.round(examResults.reduce((sum, r) => sum + r.score, 0) / examResults.length)
                : 0;
            
            return `
                <div class="admin-exam-item fade-in">
                    <div class="admin-exam-header">
                        <h4 class="admin-exam-title">${exam.title}</h4>
                        <div class="admin-exam-actions">
                            <button class="btn btn-sm btn-outline-primary edit-exam-btn" data-exam-id="${exam.id}">
                                <i class="fas fa-edit me-1"></i>ویرایش
                            </button>
                            <button class="btn btn-sm btn-outline-danger delete-exam-btn" data-exam-id="${exam.id}">
                                <i class="fas fa-trash me-1"></i>حذف
                            </button>
                        </div>
                    </div>
                    <div class="admin-exam-meta">
                        <div class="admin-exam-meta-item">
                            <i class="fas fa-clock"></i>
                            <span>${exam.duration} دقیقه</span>
                        </div>
                        <div class="admin-exam-meta-item">
                            <i class="fas fa-question-circle"></i>
                            <span>${exam.questions?.length || 0} سوال</span>
                        </div>
                        <div class="admin-exam-meta-item">
                            <i class="fas fa-star"></i>
                            <span>${exam.totalMarks} نمره</span>
                        </div>
                        <div class="admin-exam-meta-item">
                            <i class="fas fa-calendar"></i>
                            <span>${new Date(exam.createdAt).toLocaleDateString('fa-IR')}</span>
                        </div>
                    </div>
                    <p class="exam-description">${exam.description}</p>
                    <div class="admin-exam-stats">
                        <div class="admin-exam-stat">
                            <span class="admin-exam-stat-value">${examResults.length}</span>
                            <span class="admin-exam-stat-label">شرکت‌کننده</span>
                        </div>
                        <div class="admin-exam-stat">
                            <span class="admin-exam-stat-value">${avgScore}%</span>
                            <span class="admin-exam-stat-label">میانگین نمره</span>
                        </div>
                        <div class="admin-exam-stat">
                            <span class="admin-exam-stat-value">${examResults.filter(r => r.score >= 60).length}</span>
                            <span class="admin-exam-stat-label">قبول</span>
                        </div>
                        <div class="admin-exam-stat">
                            <span class="admin-exam-stat-value">${examResults.filter(r => r.score < 60).length}</span>
                            <span class="admin-exam-stat-label">مردود</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        // Add event listeners
        container.querySelectorAll('.edit-exam-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const examId = e.target.closest('button').dataset.examId;
                this.editExam(examId);
            });
        });
        
        container.querySelectorAll('.delete-exam-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const examId = e.target.closest('button').dataset.examId;
                this.deleteExam(examId);
            });
        });
    }

    openExamModal(exam = null) {
        this.currentEditingExam = exam;
        this.questionCounter = 0;
        
        const modal = document.getElementById('examModal');
        const title = document.getElementById('examModalTitle');
        
        title.textContent = exam ? 'ویرایش آزمون' : 'ایجاد آزمون جدید';
        
        // Clear form
        document.getElementById('exam-form').reset();
        document.getElementById('questions-container').innerHTML = '';
        
        if (exam) {
            document.getElementById('exam-title-input').value = exam.title;
            document.getElementById('exam-description-input').value = exam.description;
            document.getElementById('exam-duration').value = exam.duration;
            document.getElementById('exam-total-marks').value = exam.totalMarks;
            
            // Load questions
            if (exam.questions) {
                exam.questions.forEach(question => {
                    this.addQuestion(question);
                });
            }
        }
        
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    }

    addQuestion(existingQuestion = null) {
        this.questionCounter++;
        const questionId = existingQuestion?.id || `q${this.questionCounter}`;
        const questionType = existingQuestion?.type || 'multiple-choice';
        
        const questionHtml = `
            <div class="question-form" data-question-id="${questionId}">
                <div class="question-form-header">
                    <h6 class="question-form-title">سوال ${this.questionCounter}</h6>
                    <button type="button" class="question-form-remove" onclick="this.closest('.question-form').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="mb-3">
                    <label class="form-label">نوع سوال</label>
                    <select class="form-select question-type-select" data-question-id="${questionId}">
                        <option value="multiple-choice" ${questionType === 'multiple-choice' ? 'selected' : ''}>چند گزینه‌ای</option>
                        <option value="true-false" ${questionType === 'true-false' ? 'selected' : ''}>صحیح/غلط</option>
                        <option value="short-answer" ${questionType === 'short-answer' ? 'selected' : ''}>پاسخ کوتاه</option>
                    </select>
                </div>
                
                <div class="mb-3">
                    <label class="form-label">متن سوال</label>
                    <textarea class="question-text-input" rows="3" placeholder="متن سوال را وارد کنید...">${existingQuestion?.text || ''}</textarea>
                </div>
                
                <div class="mb-3">
                    <label class="form-label">نمره</label>
                    <input type="number" class="form-control question-marks" min="1" value="${existingQuestion?.marks || 10}">
                </div>
                
                <div class="question-options-section">
                    ${this.generateQuestionOptions(questionType, existingQuestion)}
                </div>
            </div>
        `;
        
        document.getElementById('questions-container').insertAdjacentHTML('beforeend', questionHtml);
        
        // Add event listener for question type change
        const typeSelect = document.querySelector(`[data-question-id="${questionId}"]`);
        typeSelect.addEventListener('change', (e) => {
            const newType = e.target.value;
            const optionsSection = e.target.closest('.question-form').querySelector('.question-options-section');
            optionsSection.innerHTML = this.generateQuestionOptions(newType);
        });
    }

    generateQuestionOptions(type, existingQuestion = null) {
        switch (type) {
            case 'multiple-choice':
                const options = existingQuestion?.options || ['', '', '', ''];
                const correctAnswer = existingQuestion?.correctAnswer || 0;
                
                return `
                    <label class="form-label">گزینه‌ها</label>
                    ${options.map((option, index) => `
                        <div class="question-option-input">
                            <input type="radio" name="correct-${this.questionCounter}" value="${index}" ${index === correctAnswer ? 'checked' : ''}>
                            <span class="correct-answer-label">صحیح</span>
                            <input type="text" placeholder="گزینه ${index + 1}" value="${option}" class="option-text">
                        </div>
                    `).join('')}
                `;
                
            case 'true-false':
                const correctBool = existingQuestion?.correctAnswer;
                return `
                    <label class="form-label">پاسخ صحیح</label>
                    <div class="question-option-input">
                        <input type="radio" name="correct-${this.questionCounter}" value="true" ${correctBool === true ? 'checked' : ''}>
                        <span class="correct-answer-label">صحیح</span>
                    </div>
                    <div class="question-option-input">
                        <input type="radio" name="correct-${this.questionCounter}" value="false" ${correctBool === false ? 'checked' : ''}>
                        <span class="correct-answer-label">غلط</span>
                    </div>
                `;
                
            case 'short-answer':
                return `
                    <label class="form-label">پاسخ صحیح</label>
                    <input type="text" class="form-control" placeholder="پاسخ صحیح را وارد کنید" value="${existingQuestion?.correctAnswer || ''}">
                `;
                
            default:
                return '';
        }
    }

    saveExam() {
        const form = document.getElementById('exam-form');
        const formData = new FormData(form);
        
        const title = document.getElementById('exam-title-input').value.trim();
        const description = document.getElementById('exam-description-input').value.trim();
        const duration = parseInt(document.getElementById('exam-duration').value);
        const totalMarks = parseInt(document.getElementById('exam-total-marks').value);
        
        if (!title || !duration || !totalMarks) {
            this.app.showNotification('لطفاً تمام فیلدهای اجباری را پر کنید.', 'error');
            return;
        }
        
        // Collect questions
        const questions = [];
        const questionForms = document.querySelectorAll('.question-form');
        
        questionForms.forEach((questionForm, index) => {
            const questionId = questionForm.dataset.questionId;
            const type = questionForm.querySelector('.question-type-select').value;
            const text = questionForm.querySelector('.question-text-input').value.trim();
            const marks = parseInt(questionForm.querySelector('.question-marks').value);
            
            if (!text) return;
            
            let question = {
                id: questionId,
                type,
                text,
                marks
            };
            
            if (type === 'multiple-choice') {
                const options = [];
                const optionInputs = questionForm.querySelectorAll('.option-text');
                let correctAnswer = 0;
                
                optionInputs.forEach((input, optIndex) => {
                    const optionText = input.value.trim();
                    if (optionText) {
                        options.push(optionText);
                        
                        const radioBtn = questionForm.querySelector(`input[type="radio"][value="${optIndex}"]`);
                        if (radioBtn && radioBtn.checked) {
                            correctAnswer = options.length - 1;
                        }
                    }
                });
                
                if (options.length < 2) return;
                
                question.options = options;
                question.correctAnswer = correctAnswer;
                
            } else if (type === 'true-false') {
                const correctRadio = questionForm.querySelector('input[type="radio"]:checked');
                if (!correctRadio) return;
                
                question.correctAnswer = correctRadio.value === 'true';
                
            } else if (type === 'short-answer') {
                const correctAnswer = questionForm.querySelector('input[type="text"]').value.trim();
                if (!correctAnswer) return;
                
                question.correctAnswer = correctAnswer;
            }
            
            questions.push(question);
        });
        
        if (questions.length === 0) {
            this.app.showNotification('لطفاً حداقل یک سوال اضافه کنید.', 'error');
            return;
        }
        
        // Save exam
        const exams = JSON.parse(localStorage.getItem('exams') || '[]');
        
        const examData = {
            id: this.currentEditingExam?.id || `exam-${Date.now()}`,
            title,
            description,
            duration,
            totalMarks,
            questions,
            createdBy: this.app.currentUser.id,
            createdAt: this.currentEditingExam?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        if (this.currentEditingExam) {
            const index = exams.findIndex(e => e.id === this.currentEditingExam.id);
            if (index !== -1) {
                exams[index] = examData;
            }
        } else {
            exams.push(examData);
        }
        
        localStorage.setItem('exams', JSON.stringify(exams));
        
        // Close modal and refresh
        const modal = bootstrap.Modal.getInstance(document.getElementById('examModal'));
        modal.hide();
        
        this.app.showNotification(
            this.currentEditingExam ? 'آزمون با موفقیت ویرایش شد.' : 'آزمون جدید با موفقیت ایجاد شد.',
            'success'
        );
        
        this.loadAdminDashboard();
        this.currentEditingExam = null;
    }

    editExam(examId) {
        const exams = JSON.parse(localStorage.getItem('exams') || '[]');
        const exam = exams.find(e => e.id === examId);
        
        if (exam) {
            this.openExamModal(exam);
        }
    }

    deleteExam(examId) {
        if (!confirm('آیا مطمئن هستید که می‌خواهید این آزمون را حذف کنید؟')) {
            return;
        }
        
        const exams = JSON.parse(localStorage.getItem('exams') || '[]');
        const filteredExams = exams.filter(e => e.id !== examId);
        
        localStorage.setItem('exams', JSON.stringify(filteredExams));
        
        // Also remove related results
        const results = JSON.parse(localStorage.getItem('examResults') || '[]');
        const filteredResults = results.filter(r => r.examId !== examId);
        localStorage.setItem('examResults', JSON.stringify(filteredResults));
        
        this.app.showNotification('آزمون با موفقیت حذف شد.', 'success');
        this.loadAdminDashboard();
    }
}
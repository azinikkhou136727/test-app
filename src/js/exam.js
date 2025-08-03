// Exam Management
export class ExamManager {
    constructor(app) {
        this.app = app;
        this.currentExam = null;
        this.currentQuestionIndex = 0;
        this.userAnswers = {};
        this.examStartTime = null;
        this.timerInterval = null;
        this.remainingTime = 0;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeDefaultExams();
    }

    setupEventListeners() {
        // Exam navigation
        document.getElementById('prev-question')?.addEventListener('click', () => {
            this.previousQuestion();
        });

        document.getElementById('next-question')?.addEventListener('click', () => {
            this.nextQuestion();
        });

        document.getElementById('submit-exam')?.addEventListener('click', () => {
            this.submitExam();
        });
    }

    initializeDefaultExams() {
        const exams = JSON.parse(localStorage.getItem('exams') || '[]');
        
        if (exams.length === 0) {
            const defaultExams = [
                {
                    id: 'exam-1',
                    title: 'آزمون ریاضی پایه',
                    description: 'آزمون مبانی ریاضی شامل جبر و هندسه',
                    duration: 30,
                    totalMarks: 100,
                    questions: [
                        {
                            id: 'q1',
                            type: 'multiple-choice',
                            text: '۲ + ۲ چند است؟',
                            options: ['۳', '۴', '۵', '۶'],
                            correctAnswer: 1,
                            marks: 10
                        },
                        {
                            id: 'q2',
                            type: 'multiple-choice',
                            text: 'مساحت مربعی با ضلع ۵ سانتی‌متر چقدر است؟',
                            options: ['۱۰ سانتی‌متر مربع', '۲۰ سانتی‌متر مربع', '۲۵ سانتی‌متر مربع', '۳۰ سانتی‌متر مربع'],
                            correctAnswer: 2,
                            marks: 15
                        },
                        {
                            id: 'q3',
                            type: 'true-false',
                            text: 'عدد ۱۷ یک عدد اول است.',
                            correctAnswer: true,
                            marks: 10
                        },
                        {
                            id: 'q4',
                            type: 'short-answer',
                            text: 'فرمول محاسبه محیط دایره چیست؟',
                            correctAnswer: '۲πr یا πd',
                            marks: 15
                        }
                    ],
                    createdBy: 'admin-1',
                    createdAt: new Date().toISOString()
                },
                {
                    id: 'exam-2',
                    title: 'آزمون علوم تجربی',
                    description: 'آزمون مبانی فیزیک و شیمی',
                    duration: 45,
                    totalMarks: 100,
                    questions: [
                        {
                            id: 'q1',
                            type: 'multiple-choice',
                            text: 'واحد اندازه‌گیری نیرو در سیستم بین‌المللی چیست؟',
                            options: ['کیلوگرم', 'نیوتن', 'متر', 'ثانیه'],
                            correctAnswer: 1,
                            marks: 20
                        },
                        {
                            id: 'q2',
                            type: 'true-false',
                            text: 'نور هم خاصیت موجی دارد و هم ذره‌ای.',
                            correctAnswer: true,
                            marks: 15
                        }
                    ],
                    createdBy: 'admin-1',
                    createdAt: new Date().toISOString()
                }
            ];
            
            localStorage.setItem('exams', JSON.stringify(defaultExams));
        }
    }

    startExam(examId) {
        const exams = JSON.parse(localStorage.getItem('exams') || '[]');
        this.currentExam = exams.find(exam => exam.id === examId);
        
        if (!this.currentExam) {
            this.app.showNotification('آزمون یافت نشد.', 'error');
            return;
        }

        // Check if already completed
        const results = JSON.parse(localStorage.getItem('examResults') || '[]');
        const existingResult = results.find(r => 
            r.examId === examId && r.userId === this.app.currentUser.id
        );
        
        if (existingResult) {
            this.app.showNotification('شما قبلاً در این آزمون شرکت کرده‌اید.', 'warning');
            return;
        }

        this.currentQuestionIndex = 0;
        this.userAnswers = {};
        this.examStartTime = new Date();
        this.remainingTime = this.currentExam.duration * 60; // Convert to seconds

        this.setupExamInterface();
        this.startTimer();
        this.showQuestion();
    }

    setupExamInterface() {
        document.getElementById('exam-title').textContent = this.currentExam.title;
        document.getElementById('exam-description').textContent = this.currentExam.description;
        document.getElementById('total-questions').textContent = this.currentExam.questions.length;

        // Setup question navigation
        this.setupQuestionNavigation();
    }

    setupQuestionNavigation() {
        const container = document.getElementById('question-nav-grid');
        container.innerHTML = this.currentExam.questions.map((_, index) => 
            `<button class="question-nav-item" data-question="${index}">${index + 1}</button>`
        ).join('');

        // Add click listeners
        container.querySelectorAll('.question-nav-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const questionIndex = parseInt(e.target.dataset.question);
                this.goToQuestion(questionIndex);
            });
        });
    }

    startTimer() {
        this.updateTimerDisplay();
        
        this.timerInterval = setInterval(() => {
            this.remainingTime--;
            this.updateTimerDisplay();
            
            if (this.remainingTime <= 0) {
                this.timeUp();
            } else if (this.remainingTime <= 300) { // 5 minutes warning
                document.getElementById('timer-display').closest('.exam-timer').classList.add('warning');
            }
        }, 1000);
    }

    updateTimerDisplay() {
        const hours = Math.floor(this.remainingTime / 3600);
        const minutes = Math.floor((this.remainingTime % 3600) / 60);
        const seconds = this.remainingTime % 60;
        
        const display = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        document.getElementById('timer-display').textContent = display;
    }

    timeUp() {
        clearInterval(this.timerInterval);
        this.app.showNotification('زمان آزمون تمام شد. آزمون به صورت خودکار ارسال می‌شود.', 'warning');
        setTimeout(() => this.submitExam(), 2000);
    }

    showQuestion() {
        const question = this.currentExam.questions[this.currentQuestionIndex];
        
        // Update navigation
        document.getElementById('current-question').textContent = this.currentQuestionIndex + 1;
        this.updateQuestionProgress();
        this.updateNavigationButtons();
        this.updateQuestionNavigation();

        // Show question
        document.getElementById('question-text').textContent = question.text;
        
        const optionsContainer = document.getElementById('question-options');
        
        if (question.type === 'multiple-choice') {
            optionsContainer.innerHTML = question.options.map((option, index) => `
                <div class="option-item" data-option="${index}">
                    <div class="option-content">
                        <div class="option-radio"></div>
                        <div class="option-text">${option}</div>
                    </div>
                </div>
            `).join('');
            
            // Add click listeners
            optionsContainer.querySelectorAll('.option-item').forEach(item => {
                item.addEventListener('click', () => {
                    this.selectOption(parseInt(item.dataset.option));
                });
            });
            
            // Restore previous answer
            if (this.userAnswers[question.id] !== undefined) {
                this.selectOption(this.userAnswers[question.id]);
            }
            
        } else if (question.type === 'true-false') {
            optionsContainer.innerHTML = `
                <div class="option-item" data-option="true">
                    <div class="option-content">
                        <div class="option-radio"></div>
                        <div class="option-text">صحیح</div>
                    </div>
                </div>
                <div class="option-item" data-option="false">
                    <div class="option-content">
                        <div class="option-radio"></div>
                        <div class="option-text">غلط</div>
                    </div>
                </div>
            `;
            
            optionsContainer.querySelectorAll('.option-item').forEach(item => {
                item.addEventListener('click', () => {
                    this.selectBooleanOption(item.dataset.option === 'true');
                });
            });
            
            // Restore previous answer
            if (this.userAnswers[question.id] !== undefined) {
                this.selectBooleanOption(this.userAnswers[question.id]);
            }
            
        } else if (question.type === 'short-answer') {
            optionsContainer.innerHTML = `
                <textarea class="text-answer" 
                          placeholder="پاسخ خود را اینجا بنویسید..."
                          data-question-id="${question.id}"></textarea>
            `;
            
            const textarea = optionsContainer.querySelector('.text-answer');
            textarea.value = this.userAnswers[question.id] || '';
            
            textarea.addEventListener('input', (e) => {
                this.userAnswers[question.id] = e.target.value;
                this.updateQuestionNavigation();
            });
        }
    }

    selectOption(optionIndex) {
        const question = this.currentExam.questions[this.currentQuestionIndex];
        this.userAnswers[question.id] = optionIndex;
        
        // Update UI
        document.querySelectorAll('.option-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        document.querySelector(`[data-option="${optionIndex}"]`).classList.add('selected');
        this.updateQuestionNavigation();
    }

    selectBooleanOption(value) {
        const question = this.currentExam.questions[this.currentQuestionIndex];
        this.userAnswers[question.id] = value;
        
        // Update UI
        document.querySelectorAll('.option-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        document.querySelector(`[data-option="${value}"]`).classList.add('selected');
        this.updateQuestionNavigation();
    }

    updateQuestionProgress() {
        const progress = ((this.currentQuestionIndex + 1) / this.currentExam.questions.length) * 100;
        document.getElementById('question-progress-bar').style.width = `${progress}%`;
    }

    updateNavigationButtons() {
        const prevBtn = document.getElementById('prev-question');
        const nextBtn = document.getElementById('next-question');
        const submitBtn = document.getElementById('submit-exam');
        
        prevBtn.disabled = this.currentQuestionIndex === 0;
        
        if (this.currentQuestionIndex === this.currentExam.questions.length - 1) {
            nextBtn.style.display = 'none';
            submitBtn.style.display = 'block';
        } else {
            nextBtn.style.display = 'block';
            submitBtn.style.display = 'none';
        }
    }

    updateQuestionNavigation() {
        document.querySelectorAll('.question-nav-item').forEach((btn, index) => {
            btn.classList.remove('current', 'answered');
            
            if (index === this.currentQuestionIndex) {
                btn.classList.add('current');
            }
            
            const questionId = this.currentExam.questions[index].id;
            if (this.userAnswers[questionId] !== undefined) {
                btn.classList.add('answered');
            }
        });
    }

    previousQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            this.showQuestion();
        }
    }

    nextQuestion() {
        if (this.currentQuestionIndex < this.currentExam.questions.length - 1) {
            this.currentQuestionIndex++;
            this.showQuestion();
        }
    }

    goToQuestion(index) {
        if (index >= 0 && index < this.currentExam.questions.length) {
            this.currentQuestionIndex = index;
            this.showQuestion();
        }
    }

    submitExam() {
        if (!this.confirmSubmission()) return;
        
        clearInterval(this.timerInterval);
        
        const results = this.calculateResults();
        this.saveResults(results);
        this.showResults();
        
        setTimeout(() => {
            this.app.showDashboard();
        }, 5000);
    }

    confirmSubmission() {
        const answeredCount = Object.keys(this.userAnswers).length;
        const totalQuestions = this.currentExam.questions.length;
        
        if (answeredCount < totalQuestions) {
            return confirm(`شما ${totalQuestions - answeredCount} سوال را بی‌پاسخ گذاشته‌اید. آیا مطمئن هستید که می‌خواهید آزمون را ارسال کنید؟`);
        }
        
        return confirm('آیا مطمئن هستید که می‌خواهید آزمون را ارسال کنید؟');
    }

    calculateResults() {
        let correctAnswers = 0;
        let totalMarks = 0;
        let earnedMarks = 0;
        
        const questionResults = this.currentExam.questions.map(question => {
            totalMarks += question.marks;
            const userAnswer = this.userAnswers[question.id];
            let isCorrect = false;
            
            if (question.type === 'multiple-choice') {
                isCorrect = userAnswer === question.correctAnswer;
            } else if (question.type === 'true-false') {
                isCorrect = userAnswer === question.correctAnswer;
            } else if (question.type === 'short-answer') {
                // Simple text matching for short answers
                isCorrect = userAnswer && 
                    userAnswer.toLowerCase().includes(question.correctAnswer.toLowerCase());
            }
            
            if (isCorrect) {
                correctAnswers++;
                earnedMarks += question.marks;
            }
            
            return {
                questionId: question.id,
                userAnswer,
                correctAnswer: question.correctAnswer,
                isCorrect,
                marks: question.marks,
                earnedMarks: isCorrect ? question.marks : 0
            };
        });
        
        const score = Math.round((earnedMarks / totalMarks) * 100);
        const timeSpent = Math.round((new Date() - this.examStartTime) / 60000); // in minutes
        
        return {
            examId: this.currentExam.id,
            userId: this.app.currentUser.id,
            score,
            correctAnswers,
            totalQuestions: this.currentExam.questions.length,
            totalMarks,
            earnedMarks,
            timeSpent,
            questionResults,
            completedAt: new Date().toISOString()
        };
    }

    saveResults(results) {
        const allResults = JSON.parse(localStorage.getItem('examResults') || '[]');
        allResults.push(results);
        localStorage.setItem('examResults', JSON.stringify(allResults));
    }

    showResults(examId = null) {
        const targetExamId = examId || this.currentExam?.id;
        if (!targetExamId) return;
        
        const results = JSON.parse(localStorage.getItem('examResults') || '[]');
        const result = results.find(r => 
            r.examId === targetExamId && r.userId === this.app.currentUser.id
        );
        
        if (!result) return;
        
        const exam = JSON.parse(localStorage.getItem('exams') || '[]')
            .find(e => e.id === targetExamId);
        
        const scoreClass = result.score >= 80 ? 'high' : result.score >= 60 ? 'medium' : 'low';
        
        const content = `
            <div class="results-summary">
                <h3>نتایج آزمون: ${exam?.title}</h3>
                <div class="results-score ${scoreClass}">${result.score}%</div>
                <p>${result.correctAnswers} از ${result.totalQuestions} سوال را درست پاسخ داده‌اید</p>
                <p>زمان صرف شده: ${result.timeSpent} دقیقه</p>
            </div>
            
            <div class="results-details">
                ${result.questionResults.map((qResult, index) => {
                    const question = exam?.questions.find(q => q.id === qResult.questionId);
                    return `
                        <div class="result-detail-item">
                            <div class="result-question">سوال ${index + 1}: ${question?.text}</div>
                            <div class="result-answer">
                                <span class="result-answer-text">پاسخ شما: ${this.formatAnswer(question, qResult.userAnswer)}</span>
                                <span class="result-answer-status ${qResult.isCorrect ? 'correct' : 'incorrect'}">
                                    ${qResult.isCorrect ? 'صحیح' : 'غلط'}
                                </span>
                            </div>
                            ${!qResult.isCorrect ? `
                                <div class="mt-2 text-success">
                                    پاسخ صحیح: ${this.formatAnswer(question, qResult.correctAnswer)}
                                </div>
                            ` : ''}
                        </div>
                    `;
                }).join('')}
            </div>
        `;
        
        document.getElementById('results-content').innerHTML = content;
        
        const modal = new bootstrap.Modal(document.getElementById('resultsModal'));
        modal.show();
    }

    formatAnswer(question, answer) {
        if (question?.type === 'multiple-choice') {
            return question.options[answer] || 'پاسخ داده نشده';
        } else if (question?.type === 'true-false') {
            return answer === true ? 'صحیح' : answer === false ? 'غلط' : 'پاسخ داده نشده';
        } else {
            return answer || 'پاسخ داده نشده';
        }
    }
}
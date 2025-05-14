// src/components/ExamTakingPage.js
import React, { useState, useEffect, useCallback } from 'react';
import '../App.css'; // Global CSS
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faClock, faChevronLeft, faChevronRight, faCheckCircle,
    faSpinner, faExclamationTriangle, faStar // faStar ikonu
} from '@fortawesome/free-solid-svg-icons'; // Icons

function ExamTakingPage({ examData, onFinishExam }) {

    // --- Prop Validation & Initial Setup ---
    const isValidExamData = examData && examData.quizId != null && Array.isArray(examData.questions);
    const questions = isValidExamData ? examData.questions : [];
    const initialDurationSeconds = (isValidExamData && examData.durationMinutes != null && examData.durationMinutes > 0)
        ? examData.durationMinutes * 60
        : 0;

    // --- State Management ---
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState(() => {
        if (!isValidExamData) return {};
        const initial = {};
        questions.forEach(q => {
            if (q && q.id != null) {
                initial[q.id.toString()] = '';
            }
        });
        return initial;
    });
    const [timeLeft, setTimeLeft] = useState(initialDurationSeconds);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- Timer Effect ---
    useEffect(() => {
        if (!isValidExamData || initialDurationSeconds <= 0 || questions.length === 0) {
            console.warn("[ExamTakingPage] Timer conditions not met. Timer not started.");
            if (isValidExamData && initialDurationSeconds <= 0 && questions.length > 0) {
                console.error("[ExamTakingPage] Exam started with zero or invalid duration!");
            }
            return;
        }

        console.log(`[ExamTakingPage] Starting timer: ${initialDurationSeconds} seconds for Quiz ID ${examData.quizId}.`);

        const timerId = setInterval(() => {
            setTimeLeft(prevTime => {
                if (prevTime <= 1) {
                    clearInterval(timerId);
                    console.log("[ExamTakingPage] Timer reached zero. Auto-submitting...");
                    handleFinish(true); // Trigger auto-submission
                    return 0;
                }
                return prevTime - 1;
            });
        }, 1000);

        return () => {
            console.log('[ExamTakingPage] Clearing timer interval.');
            clearInterval(timerId);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isValidExamData, initialDurationSeconds, questions.length, examData?.quizId]);

    // --- Time Formatting Utility ---
    const formatTime = (seconds) => {
        if (isNaN(seconds) || seconds < 0) seconds = 0;
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // --- Navigation Handlers ---
    const handleNextQuestion = useCallback(() => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prevIndex => prevIndex + 1);
        }
    }, [currentQuestionIndex, questions.length]);

    const handlePrevQuestion = useCallback(() => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prevIndex => prevIndex - 1);
        }
    }, [currentQuestionIndex]);

    // --- Answer Change Handler ---
    const handleAnswerChange = useCallback((questionId, answer) => {
        if (questionId == null) {
            console.error("[ExamTakingPage] handleAnswerChange called without questionId!");
            return;
        }
        const idStr = questionId.toString();
        setAnswers(prevAnswers => ({
            ...prevAnswers,
            [idStr]: answer
        }));
    }, []);

    // --- Exam Submission Handler ---
    const handleFinish = useCallback((autoSubmit = false) => {
        if (isSubmitting) {
            console.warn("[ExamTakingPage] Submission already in progress.");
            return;
        }
        const confirmMessage = "Are you sure you want to finish and submit the exam?";
        if (autoSubmit || window.confirm(confirmMessage)) {
            setIsSubmitting(true);
            console.log("[ExamTakingPage] Submitting exam. Final Answers:", answers);
            if (onFinishExam) {
                onFinishExam(examData?.quizId, answers);
            } else {
                console.error("[ExamTakingPage] CRITICAL: onFinishExam prop is missing!");
                alert("Submission Error: Cannot submit exam. Please contact support.");
                setIsSubmitting(false);
            }
        } else {
            console.log("[ExamTakingPage] Exam submission cancelled by user.");
        }
    }, [onFinishExam, examData?.quizId, answers, isSubmitting]);

    // --- Data Validation and Error Handling ---
    // (Bu kısımlar öncekiyle aynı kalabilir)
    if (!isValidExamData) { /* ... */ }
    if (initialDurationSeconds <= 0 && questions.length > 0) { /* ... */ }
    if (questions.length === 0) { /* ... */ }

    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion || currentQuestion.id == null) { /* ... */ }

    // --- Dynamic Question Content Rendering ---
    const renderQuestionContent = (question) => {
        // *** DEBUG: Gelen soru verisini kontrol et ***
        console.log('[ExamTakingPage] Rendering Question:', question);
        // *** --- ***

        const questionIdStr = question.id.toString();
        const currentAnswer = answers[questionIdStr] || '';
        const mcqOptions = [question.option1, question.option2, question.option3, question.option4]
            .filter(opt => opt != null);

        // Puanı kontrol et ve gösterilecek metni hazırla
        const questionPoints = question.points; // Veriden puanı al
        const showPoints = questionPoints != null; // Puan null veya undefined değilse göster

        return (
            <div>
                <p className="exam-question-text">
                    {question.questiontitle || <span className="error-message">Question text missing!</span>}

                    {/* --- PUAN GÖSTERİM KISMI (Güncellendi) --- */}
                    {showPoints && (
                        <span className="question-points-indicator">
                            <FontAwesomeIcon icon={faStar} /> {questionPoints} pts
                        </span>
                    )}
                     {/* Puan yoksa veya null ise hiçbir şey gösterme */}
                    {/* --- --- --- */}
                </p>
                <div className="exam-answer-area">
                    {/* MCQ */}
                    {question.type === 'MCQ' && mcqOptions.length > 0 && (
                        <div className='exam-options mcq-options'>
                            {mcqOptions.map((option, index) => {
                                const optionLetter = String.fromCharCode(65 + index);
                                return (
                                    <label key={`${questionIdStr}_${optionLetter}`} className='exam-option-label'>
                                        <input
                                            type="radio" name={`q_${questionIdStr}`} value={optionLetter}
                                            checked={currentAnswer === optionLetter}
                                            onChange={(e) => handleAnswerChange(questionIdStr, e.target.value)}
                                            disabled={isSubmitting}
                                        />
                                        <span>{optionLetter}) {option}</span>
                                    </label>
                                );
                            })}
                        </div>
                    )}
                    {/* Short Answer */}
                    {question.type === 'Short Answer' && (
                        <input
                            type="text" className="input-field short-answer-input"
                            placeholder="Type your answer here..."
                            value={currentAnswer}
                            onChange={(e) => handleAnswerChange(questionIdStr, e.target.value)}
                            disabled={isSubmitting}
                        />
                    )}
                    {/* TF */}
                    {question.type === 'TF' && (
                        <div className='exam-options tf-options'>
                            <label className='exam-option-label'>
                                <input
                                    type="radio" name={`q_${questionIdStr}`} value="True"
                                    checked={currentAnswer === 'True'}
                                    onChange={(e) => handleAnswerChange(questionIdStr, e.target.value)}
                                    disabled={isSubmitting}
                                />
                                <span>True</span>
                            </label>
                            <label className='exam-option-label'>
                                <input
                                    type="radio" name={`q_${questionIdStr}`} value="False"
                                    checked={currentAnswer === 'False'}
                                    onChange={(e) => handleAnswerChange(questionIdStr, e.target.value)}
                                    disabled={isSubmitting}
                                />
                                <span>False</span>
                            </label>
                        </div>
                    )}
                    {/* Unsupported */}
                    {!['MCQ', 'Short Answer', 'TF'].includes(question.type) && (
                         <p className="warning-message">Unsupported question type: "{question.type}"</p>
                    )}
                </div>
            </div>
        );
    };

    // --- Final JSX Render ---
    return (
        <div className="exam-taking-page animated-fade-in">
            <header className="exam-header widget-card">
                <h2>{examData.title || "Exam"}</h2>
                <div className={`timer ${timeLeft < 60 && timeLeft > 0 ? 'timer-warning' : ''}`}>
                    <FontAwesomeIcon icon={faClock} />
                    <span>{formatTime(timeLeft)}</span>
                </div>
            </header>
            <div className="exam-content">
                <div className="question-area widget-card animated-fade-in-up">
                    <h4>Question {currentQuestionIndex + 1} of {questions.length}</h4>
                    {currentQuestion && renderQuestionContent(currentQuestion)}
                </div>
                <div className="exam-navigation widget-card">
                    <button onClick={handlePrevQuestion} disabled={currentQuestionIndex === 0 || isSubmitting} className="widget-button secondary">
                        <FontAwesomeIcon icon={faChevronLeft} /> Previous
                    </button>
                    {currentQuestionIndex === questions.length - 1 ? (
                        <button onClick={() => handleFinish(false)} disabled={isSubmitting} className="widget-button primary finish-button">
                            {isSubmitting ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faCheckCircle} />}
                            {isSubmitting ? ' Submitting...' : ' Finish Exam'}
                        </button>
                    ) : (
                        <button onClick={handleNextQuestion} disabled={currentQuestionIndex === questions.length - 1 || isSubmitting} className="widget-button secondary">
                            Next <FontAwesomeIcon icon={faChevronRight} />
                        </button>
                    )}
                </div>
            </div>
            {/* --- CSS --- */}
            <style jsx>{`
                /* Önceki stiller... */
                .exam-taking-page { max-width: 900px; margin: 20px auto; padding: 0 15px; }
                .exam-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding: 15px 25px; }
                .exam-header h2 { margin: 0; font-size: 1.6rem; color: var(--text-light); }
                .timer { font-size: 1.2rem; font-weight: 600; display: flex; align-items: center; gap: 8px; color: var(--accent-primary); }
                .timer-warning { color: var(--error-color); animation: pulseWarning 1s infinite; }
                @keyframes pulseWarning { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }

                .exam-content { display: flex; flex-direction: column; gap: 20px; }
                .question-area { padding: 25px 30px; }
                .question-area h4 { margin: 0 0 20px 0; font-size: 1.1rem; color: var(--text-medium); border-bottom: 1px solid var(--border-light); padding-bottom: 10px; }
                .exam-question-text { font-size: 1.1rem; line-height: 1.7; color: var(--text-light); margin-bottom: 25px; position: relative; /* Puan göstergesi için */ }

                /* --- PUAN GÖSTERGESİ STİLİ --- */
                .question-points-indicator {
                    display: inline-block; /* Metinle aynı satırda */
                    margin-left: 15px; /* Soru metninden biraz boşluk */
                    font-size: 0.85em;
                    font-weight: 600;
                    color: var(--text-medium);
                    background-color: rgba(255, 255, 255, 0.08); /* Biraz daha belirgin arka plan */
                    padding: 4px 10px; /* Biraz daha dolgun */
                    border-radius: var(--border-radius-sm);
                    border: 1px solid var(--border-light);
                    vertical-align: middle; /* Dikey hizalama */
                    line-height: 1; /* Satır yüksekliği */
                    white-space: nowrap; /* Tek satırda kalmasını sağla */
                }
                .question-points-indicator svg {
                    margin-right: 5px; /* İkon ve metin arası boşluk */
                    color: #facc15; /* Sarı yıldız */
                    vertical-align: -1px; /* İkonu biraz aşağı al */
                }
                 /* --- --- --- */

                .exam-answer-area { margin-top: 20px; }
                .exam-options { display: flex; flex-direction: column; gap: 15px; }
                .exam-option-label { display: flex; align-items: center; gap: 12px; cursor: pointer; background-color: rgba(255, 255, 255, 0.03); padding: 12px 15px; border-radius: var(--border-radius-sm); transition: background-color 0.2s; border: 1px solid transparent; }
                .exam-option-label:hover { background-color: rgba(255, 255, 255, 0.07); }
                .exam-option-label input[type="radio"] { margin: 0; width: 16px; height: 16px; accent-color: var(--accent-primary); }
                .exam-option-label span { flex-grow: 1; color: var(--text-light); }
                .exam-option-label input[type="radio"]:checked + span { font-weight: 600; }
                .exam-option-label input[type="radio"]:checked { outline: 2px solid var(--accent-primary); outline-offset: 2px;}

                .short-answer-input { width: 100%; max-width: 500px; }
                .tf-options label { padding: 10px 15px; }

                .exam-navigation { display: flex; justify-content: space-between; align-items: center; padding: 15px 25px; margin-top: 10px; }
                .finish-button { background-color: var(--student-accent); border-color: var(--student-accent); color: var(--text-dark); }
                .finish-button:hover:not(:disabled) { background-color: #2aa17a; border-color: #2aa17a; }
                .widget-button:disabled { opacity: 0.5; cursor: not-allowed; }

                 .error-message, .warning-message {
                    font-size: 0.9em;
                    padding: 10px 15px;
                    border-radius: var(--border-radius-sm);
                    margin-top: 10px;
                    text-align: center;
                 }
                 .error-message { color: var(--error-color); background-color: var(--error-bg); border: 1px solid var(--error-color); }
                 .warning-message { color: #facc15; background-color: rgba(252, 211, 77, 0.1); border: 1px solid rgba(252, 211, 77, 0.5); }
            `}</style>
        </div>
    );
}

export default ExamTakingPage;
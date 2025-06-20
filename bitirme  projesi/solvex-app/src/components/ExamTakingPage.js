import React, { useState, useEffect, useCallback, useRef } from 'react';
import '../App.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faClock, faChevronLeft, faChevronRight, faCheckCircle,
    faSpinner, faExclamationTriangle, faStar, faBan
} from '@fortawesome/free-solid-svg-icons';

const getInProgressExamKey = (userId, quizId) => `inProgressQuizSession_${userId}_${quizId}`;
const getExamAttemptStatusKey = (userId, quizId) => `examAttemptStatus_${userId}_${quizId}`;

const generateSessionId = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

function ExamTakingPage({ examData, onFinishExam, user }) {
    const userId = user?.id;
    const quizId = examData?.quizId;
    const LSK_SessionData = userId && quizId ? getInProgressExamKey(userId, quizId) : null;
    const LSK_AttemptStatus = userId && quizId ? getExamAttemptStatusKey(userId, quizId) : null;

    const isValidExamData = examData && quizId != null && Array.isArray(examData.questions) && userId != null;
    const questions = isValidExamData ? examData.questions : [];

    const initialDurationMinutes = (examData?.durationMinutes != null && Number(examData.durationMinutes) > 0)
        ? Number(examData.durationMinutes)
        : 0;
    const initialDurationSecondsFallback = initialDurationMinutes * 60;

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState(initialDurationSecondsFallback);
    const [isSubmittingLocal, setIsSubmittingLocal] = useState(false);
    const [pageInitialized, setPageInitialized] = useState(false);
    const [sessionStatus, setSessionStatus] = useState('initializing');
    const [currentSessionId, setCurrentSessionId] = useState(() => generateSessionId());
    const [accessDenied, setAccessDenied] = useState(false);

    const submitCalledRef = useRef(false);

    useEffect(() => {
        if (!isValidExamData || !LSK_SessionData || !LSK_AttemptStatus) {
            setSessionStatus('error');
            setPageInitialized(true);
            return;
        }

        if (sessionStatus !== 'initializing' || pageInitialized) {
            return;
        }

        let initialAnswersState = {};
        questions.forEach(q => {
            if (q && q.id != null) initialAnswersState[q.id.toString()] = '';
        });

        try {
            const attemptStatus = localStorage.getItem(LSK_AttemptStatus);
            const storedSessionDataString = localStorage.getItem(LSK_SessionData);

            if (attemptStatus === 'SUBMITTED') {
                setAccessDenied(true);
                setSessionStatus('access_denied_submitted');
                setPageInitialized(true);
                return;
            }

            if (storedSessionDataString) {
                const storedSession = JSON.parse(storedSessionDataString);
                if (storedSession.quizId === quizId && storedSession.userId === userId) {
                    initialAnswersState = storedSession.answers || initialAnswersState;
                    setAnswers(initialAnswersState);

                    if (storedSession.status === 'session_active' &&
                        storedSession.sessionId &&
                        storedSession.sessionId !== currentSessionId &&
                        attemptStatus === 'IN_PROGRESS') {
                        setAccessDenied(true);
                        setSessionStatus('access_denied_active_session');
                    } else if (storedSession.status === 'refresh_pending_submit' || storedSession.status === 'submitting') {
                        if (storedSession.sessionId === currentSessionId || (!storedSession.sessionId && attemptStatus === 'IN_PROGRESS') ) {
                            setSessionStatus(storedSession.status);
                            setTimeLeft(0);
                        } else {
                            setAccessDenied(true);
                            setSessionStatus('access_denied_active_session');
                        }
                    } else {
                        const startTime = (storedSession.status === 'session_active' && storedSession.sessionId === currentSessionId && storedSession.startTime)
                            ? storedSession.startTime
                            : Date.now();
                        const storedDurationMinutes = storedSession.durationMinutes || initialDurationMinutes;
                        const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
                        const newTimeLeft = Math.max(0, (storedDurationMinutes * 60) - elapsedTime);

                        setTimeLeft(newTimeLeft);
                        setSessionStatus('active');
                        localStorage.setItem(LSK_SessionData, JSON.stringify({
                            quizId, userId, answers: initialAnswersState,
                            startTime: startTime,
                            durationMinutes: initialDurationMinutes,
                            status: 'session_active', sessionId: currentSessionId
                        }));
                        if (localStorage.getItem(LSK_AttemptStatus) !== 'IN_PROGRESS') {
                            localStorage.setItem(LSK_AttemptStatus, 'IN_PROGRESS');
                        }
                    }
                } else {
                    localStorage.setItem(LSK_SessionData, JSON.stringify({
                        quizId, userId, answers: initialAnswersState,
                        startTime: Date.now(), durationMinutes: initialDurationMinutes,
                        status: 'session_active', sessionId: currentSessionId
                    }));
                    localStorage.setItem(LSK_AttemptStatus, 'IN_PROGRESS');
                    setTimeLeft(initialDurationSecondsFallback);
                    setSessionStatus('active');
                }
            } else {
                localStorage.setItem(LSK_SessionData, JSON.stringify({
                    quizId, userId, answers: initialAnswersState,
                    startTime: Date.now(), durationMinutes: initialDurationMinutes,
                    status: 'session_active', sessionId: currentSessionId
                }));
                localStorage.setItem(LSK_AttemptStatus, 'IN_PROGRESS');
                setTimeLeft(initialDurationSecondsFallback);
                setSessionStatus('active');
            }
        } catch (error) {
            localStorage.setItem(LSK_SessionData, JSON.stringify({
                quizId, userId, answers: initialAnswersState,
                startTime: Date.now(), durationMinutes: initialDurationMinutes,
                status: 'session_active', sessionId: currentSessionId
            }));
            localStorage.setItem(LSK_AttemptStatus, 'IN_PROGRESS');
            setTimeLeft(initialDurationSecondsFallback);
            setSessionStatus('active');
        }
        if(Object.keys(answers).length === 0 && Object.keys(initialAnswersState).length > 0) {
            setAnswers(initialAnswersState);
        }
        setPageInitialized(true);
    }, [isValidExamData, LSK_SessionData, LSK_AttemptStatus, quizId, userId, initialDurationMinutes, questions]);


    const handleFinish = useCallback((autoSubmit = false) => {
        if (submitCalledRef.current || sessionStatus === 'submitting' || sessionStatus === 'submitted' || accessDenied) {
            return;
        }
        const performSubmit = () => {
            submitCalledRef.current = true;
            setIsSubmittingLocal(true);
            setSessionStatus('submitting');

            if (LSK_SessionData) {
                try {
                    const currentDataStr = localStorage.getItem(LSK_SessionData);
                    const currentData = currentDataStr ? JSON.parse(currentDataStr) : {};
                    localStorage.setItem(LSK_SessionData, JSON.stringify({
                        ...currentData, answers: answers, status: 'submitting', sessionId: currentSessionId
                    }));
                } catch (e) {  }
            }

            if (onFinishExam) {
                onFinishExam(quizId, answers)
                    .then(() => {
                        setSessionStatus('submitted');
                    })
                    .catch(() => {
                        setSessionStatus('error_submitting');
                        setIsSubmittingLocal(false);
                        submitCalledRef.current = false;
                        if (LSK_SessionData) {
                            try {
                                const currentDataStr = localStorage.getItem(LSK_SessionData);
                                const currentData = currentDataStr ? JSON.parse(currentDataStr) : {};
                                if (currentData.status === 'submitting') {
                                    localStorage.setItem(LSK_SessionData, JSON.stringify({
                                        ...currentData, status: 'session_active'
                                    }));
                                    if (LSK_AttemptStatus) localStorage.setItem(LSK_AttemptStatus, 'IN_PROGRESS');
                                }
                            } catch(e) {}
                        }
                    });
            } else {
                setIsSubmittingLocal(false);
                submitCalledRef.current = false;
                setSessionStatus('error');
            }
        };
        if (autoSubmit) performSubmit();
        else if (window.confirm("Are you sure you want to finish and submit the exam?")) performSubmit();

    }, [quizId, answers, onFinishExam, LSK_SessionData, LSK_AttemptStatus, sessionStatus, accessDenied, currentSessionId]);

    useEffect(() => {
        if (!pageInitialized || !isValidExamData || questions.length === 0 || submitCalledRef.current || sessionStatus === 'submitting' || sessionStatus === 'submitted' || accessDenied) {
            return;
        }
        if ((sessionStatus === 'refresh_pending_submit' || sessionStatus === 'pending_auto_submit' || timeLeft <= 0) && sessionStatus !== 'active') {
            if (!submitCalledRef.current) {
                handleFinish(true);
            }
            return;
        }
        if (timeLeft <= 0 && sessionStatus === 'active' && !submitCalledRef.current) {
            handleFinish(true);
            return;
        }
        if (timeLeft > 0 && sessionStatus === 'active') {
            const timerId = setInterval(() => setTimeLeft(prevTime => prevTime - 1), 1000);
            return () => clearInterval(timerId);
        }
    }, [pageInitialized, isValidExamData, timeLeft, questions.length, sessionStatus, handleFinish, accessDenied]);

    useEffect(() => {
        if (!pageInitialized || !isValidExamData || !LSK_SessionData || submitCalledRef.current || sessionStatus === 'submitting' || sessionStatus === 'submitted' || accessDenied) {
            return;
        }
        const handleBeforeUnload = (event) => {
            if (submitCalledRef.current || sessionStatus === 'submitting' || sessionStatus === 'submitted') return;
            try {
                localStorage.setItem(LSK_SessionData, JSON.stringify({
                    quizId, userId, answers,
                    startTime: JSON.parse(localStorage.getItem(LSK_SessionData) || '{}').startTime || Date.now(),
                    durationMinutes: initialDurationMinutes,
                    status: 'refresh_pending_submit',
                    sessionId: currentSessionId
                }));
            } catch (e) {}
            event.preventDefault();
            event.returnValue = "Changes you made may not be saved. Your progress will be submitted if you refresh or close.";
            return event.returnValue;
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [pageInitialized, isValidExamData, LSK_SessionData, answers, quizId, userId, initialDurationMinutes, sessionStatus, accessDenied, currentSessionId]);

    const formatTime = (seconds) => {
        if (isNaN(seconds) || seconds < 0) seconds = 0;
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleNextQuestion = useCallback(() => {
        if (currentQuestionIndex < questions.length - 1 && sessionStatus === 'active' && !accessDenied) {
            setCurrentQuestionIndex(prevIndex => prevIndex + 1);
        }
    }, [currentQuestionIndex, questions.length, sessionStatus, accessDenied]);

    const handlePrevQuestion = useCallback(() => {
        if (currentQuestionIndex > 0 && sessionStatus === 'active' && !accessDenied) {
            setCurrentQuestionIndex(prevIndex => prevIndex - 1);
        }
    }, [currentQuestionIndex, sessionStatus, accessDenied]);

    const handleAnswerChange = useCallback((questionIdStr, answer) => {
        if (questionIdStr == null || sessionStatus !== 'active' || submitCalledRef.current || accessDenied) {
            return;
        }
        setAnswers(prevAnswers => {
            const newAnswers = { ...prevAnswers, [questionIdStr]: answer };
            if (LSK_SessionData && pageInitialized) {
                try {
                    localStorage.setItem(LSK_SessionData, JSON.stringify({
                        quizId, userId, answers: newAnswers,
                        startTime: JSON.parse(localStorage.getItem(LSK_SessionData) || '{}').startTime || Date.now(),
                        durationMinutes: initialDurationMinutes,
                        status: 'session_active',
                        sessionId: currentSessionId
                    }));
                } catch (e) {  }
            }
            return newAnswers;
        });
    }, [LSK_SessionData, pageInitialized, quizId, userId, initialDurationMinutes, sessionStatus, accessDenied, currentSessionId]);

    const uiDisabled = sessionStatus === 'submitting' || sessionStatus === 'submitted' || sessionStatus === 'error_submitting' || sessionStatus === 'pending_auto_submit' || sessionStatus === 'refresh_pending_submit' || accessDenied;

    if (accessDenied) {
        let message = "An active session for this exam is already in progress on another tab or device.";
        if (sessionStatus === 'access_denied_submitted') {
            message = "You have already submitted this exam. You cannot start it again.";
        }
        return (
            <div className="exam-taking-page animated-fade-in">
                <div className="error-message widget-card" style={{textAlign: 'center', padding: '40px'}}>
                    <FontAwesomeIcon icon={faBan} size="3x" style={{color: 'var(--error-color)', marginBottom: '20px'}} />
                    <h3>Access Denied</h3>
                    <p>{message}</p>
                    {sessionStatus !== 'access_denied_submitted' &&
                        <p>Please complete or close the other session to continue.</p>
                    }
                </div>
            </div>
        );
    }

    if (sessionStatus === 'initializing' && !pageInitialized) {
        return (
            <div className="exam-taking-page animated-fade-in">
                <div className="loading-placeholder">
                    <FontAwesomeIcon icon={faSpinner} spin />
                    <span> Initializing exam session...</span>
                </div>
            </div>
        );
    }
    if (sessionStatus === 'error' || (!isValidExamData && pageInitialized)) {
        return (
            <div className="exam-taking-page animated-fade-in">
                <div className="error-message widget-card">
                    <FontAwesomeIcon icon={faExclamationTriangle} /> Error: Invalid exam data or user information. Cannot start exam.
                </div>
            </div>
        );
    }
    if (sessionStatus === 'submitting' || sessionStatus === 'pending_auto_submit' || sessionStatus === 'refresh_pending_submit') {
        return (
            <div className="exam-taking-page animated-fade-in">
                <div className="loading-placeholder">
                    <FontAwesomeIcon icon={faSpinner} spin />
                    <span> Submitting your exam... Please wait.</span>
                </div>
            </div>
        );
    }
    if (sessionStatus === 'error_submitting') {
        return (
            <div className="exam-taking-page animated-fade-in">
                <div className="error-message widget-card">
                    <FontAwesomeIcon icon={faExclamationTriangle} /> Error submitting exam. Please try again or contact support.
                </div>
            </div>
        );
    }
    if (sessionStatus === 'submitted') {
        return (
            <div className="exam-taking-page animated-fade-in">
                <div className="widget-card" style={{textAlign: 'center', padding: '40px'}}>
                    <FontAwesomeIcon icon={faCheckCircle} size="3x" style={{color: 'var(--student-accent)', marginBottom: '20px'}} />
                    <h3>Exam Submitted!</h3>
                    <p>Your responses have been recorded. You will be redirected shortly.</p>
                </div>
            </div>
        );
    }
    if (initialDurationSecondsFallback <= 0 && questions.length > 0 && pageInitialized) {
        return (
            <div className="exam-taking-page animated-fade-in">
                <div className="error-message widget-card">
                    <FontAwesomeIcon icon={faExclamationTriangle} /> Exam has an invalid duration. Cannot start.
                </div>
            </div>
        );
    }
    if (questions.length === 0 && pageInitialized) {
        return (
            <div className="exam-taking-page animated-fade-in">
                <div className="warning-message widget-card">
                    <FontAwesomeIcon icon={faExclamationTriangle} /> This exam currently has no questions.
                </div>
            </div>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];
    if (pageInitialized && (!currentQuestion || currentQuestion.id == null) && !accessDenied && sessionStatus !== 'error' && sessionStatus !== 'submitted' && sessionStatus !== 'submitting') {
        return (
            <div className="exam-taking-page animated-fade-in">
                <div className="error-message widget-card">
                    <FontAwesomeIcon icon={faExclamationTriangle} /> Error: Current question data is invalid.
                </div>
            </div>
        );
    }

    const renderQuestionContent = (question) => {
        const questionIdStr = question.id.toString();
        const currentAnswer = answers[questionIdStr] || '';
        const mcqOptions = [question.option1, question.option2, question.option3, question.option4]
            .filter(opt => opt != null);
        const questionPoints = question.points;
        const showPoints = questionPoints != null;

        return (
            <div>
                <p className="exam-question-text">
                    {question.questiontitle || <span className="error-message">Question text missing!</span>}
                    {showPoints && (
                        <span className="question-points-indicator">
                            <FontAwesomeIcon icon={faStar} /> {questionPoints} pts
                        </span>
                    )}
                </p>
                <div className="exam-answer-area">
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
                                            disabled={uiDisabled}
                                        />
                                        <span>{optionLetter}) {option}</span>
                                    </label>
                                );
                            })}
                        </div>
                    )}
                    {question.type === 'Short Answer' && (
                        <input
                            type="text" className="input-field short-answer-input"
                            placeholder="Type your answer here..."
                            value={currentAnswer}
                            onChange={(e) => handleAnswerChange(questionIdStr, e.target.value)}
                            disabled={uiDisabled}
                        />
                    )}
                    {question.type === 'TF' && (
                        <div className='exam-options tf-options'>
                            <label className='exam-option-label'>
                                <input
                                    type="radio" name={`q_${questionIdStr}`} value="True"
                                    checked={currentAnswer === 'True'}
                                    onChange={(e) => handleAnswerChange(questionIdStr, e.target.value)}
                                    disabled={uiDisabled}
                                />
                                <span>True</span>
                            </label>
                            <label className='exam-option-label'>
                                <input
                                    type="radio" name={`q_${questionIdStr}`} value="False"
                                    checked={currentAnswer === 'False'}
                                    onChange={(e) => handleAnswerChange(questionIdStr, e.target.value)}
                                    disabled={uiDisabled}
                                />
                                <span>False</span>
                            </label>
                        </div>
                    )}
                    {!['MCQ', 'Short Answer', 'TF'].includes(question.type) && (
                        <p className="warning-message">Unsupported question type: "{question.type}"</p>
                    )}
                </div>
            </div>
        );
    };

    if (!pageInitialized || (pageInitialized && !isValidExamData && sessionStatus !== 'error' && !accessDenied)) {
        return (
            <div className="exam-taking-page animated-fade-in">
                <div className="loading-placeholder">
                    <FontAwesomeIcon icon={faSpinner} spin />
                    <span>Loading exam...</span>
                </div>
            </div>
        );
    }
    if (sessionStatus === 'error' && !accessDenied) {
        return (
            <div className="exam-taking-page animated-fade-in">
                <div className="error-message widget-card">
                    <FontAwesomeIcon icon={faExclamationTriangle} /> Error: Could not initialize exam session.
                </div>
            </div>
        );
    }

    return (
        <div className="exam-taking-page animated-fade-in">
            <header className="exam-header widget-card">
                <h2>{examData.title || "Exam"}</h2>
                <div className={`timer ${timeLeft < 60 && timeLeft > 0 && sessionStatus === 'active' ? 'timer-warning' : ''}`}>
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
                    <button onClick={handlePrevQuestion} disabled={currentQuestionIndex === 0 || uiDisabled} className="widget-button secondary">
                        <FontAwesomeIcon icon={faChevronLeft} /> Previous
                    </button>
                    {currentQuestionIndex === questions.length - 1 ? (
                        <button onClick={() => handleFinish(false)} disabled={uiDisabled} className="widget-button primary finish-button">
                            {(sessionStatus === 'submitting' || isSubmittingLocal) ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faCheckCircle} />}
                            {(sessionStatus === 'submitting' || isSubmittingLocal) ? ' Submitting...' : ' Finish Exam'}
                        </button>
                    ) : (
                        <button onClick={handleNextQuestion} disabled={currentQuestionIndex === questions.length - 1 || uiDisabled} className="widget-button secondary">
                            Next <FontAwesomeIcon icon={faChevronRight} />
                        </button>
                    )}
                </div>
            </div>
            <style jsx>{`
                .exam-taking-page { max-width: 900px; margin: 20px auto; padding: 0 15px; }
                .exam-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding: 15px 25px; }
                .exam-header h2 { margin: 0; font-size: 1.6rem; color: var(--text-light); }
                .timer { font-size: 1.2rem; font-weight: 600; display: flex; align-items: center; gap: 8px; color: var(--accent-primary); }
                .timer-warning { color: var(--error-color); animation: pulseWarning 1s infinite; }
                @keyframes pulseWarning { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
                .exam-content { display: flex; flex-direction: column; gap: 20px; }
                .question-area { padding: 25px 30px; }
                .question-area h4 { margin: 0 0 20px 0; font-size: 1.1rem; color: var(--text-medium); border-bottom: 1px solid var(--border-light); padding-bottom: 10px; }
                .exam-question-text { font-size: 1.1rem; line-height: 1.7; color: var(--text-light); margin-bottom: 25px; position: relative; }
                .question-points-indicator {
                    display: inline-block; margin-left: 15px; font-size: 0.85em;
                    font-weight: 600; color: var(--text-medium);
                    background-color: rgba(255, 255, 255, 0.08); padding: 4px 10px;
                    border-radius: var(--border-radius-sm); border: 1px solid var(--border-light);
                    vertical-align: middle; line-height: 1; white-space: nowrap;
                }
                .question-points-indicator svg { margin-right: 5px; color: #facc15; vertical-align: -1px; }
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
                    font-size: 0.9em; padding: 10px 15px;
                    border-radius: var(--border-radius-sm); margin-top: 10px; text-align: center;
                }
                .error-message { color: var(--error-color); background-color: var(--error-bg); border: 1px solid var(--error-color); }
                .warning-message { color: #facc15; background-color: rgba(252, 211, 77, 0.1); border: 1px solid rgba(252, 211, 77, 0.5); }
                .loading-placeholder {
                    text-align: center; padding: 40px 20px; color: var(--text-medium); width: 100%;
                    border-radius: var(--border-radius-md); margin-top: 20px;
                    display: flex; flex-direction: column; align-items: center; justify-content: center;
                    font-size: 1.1rem;
                }
                .loading-placeholder svg { margin-bottom: 15px; font-size: 2rem; }
            `}</style>
        </div>
    );
}

export default ExamTakingPage;
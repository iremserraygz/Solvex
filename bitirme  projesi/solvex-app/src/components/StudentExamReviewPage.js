// src/components/StudentExamReviewPage.js
import React from 'react'; // useMemo kaldırıldı
import '../App.css'; // Global CSS
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faChevronLeft, faCheckCircle, faTimesCircle, faPercentage,
    faCalendarAlt, faInfoCircle, faQuestionCircle, faCommentAlt,
    faExclamationTriangle, faStar
} from '@fortawesome/free-solid-svg-icons';

// Props:
// - onBack: Function to navigate back to history
// - examReviewData: QuizReviewDto (backend'den gelen)
//   { submissionId, quizId, quizTitle, dateTaken, achievedPoints, totalPossiblePoints, questions: [...] }
//   questions: [{ id, questiontitle, type, points, options, correctAnswer, userAnswer, isCorrect }]
function StudentExamReviewPage({ onBack, examReviewData }) {

    // --- Data Validation & Destructuring ---
    if (!examReviewData || !examReviewData.submissionId || !Array.isArray(examReviewData.questions)) {
        console.error("[StudentExamReviewPage] Invalid or missing examReviewData prop:", examReviewData);
        // --- DÜZELTME: Geçerli JSX döndür ---
        return (
            <div className="loading-placeholder widget-card"> {/* Use appropriate class */}
                <FontAwesomeIcon icon={faExclamationTriangle} size="2x" style={{ color: 'var(--error-color)', marginBottom: '15px' }}/>
                <h4>Error Loading Review</h4>
                <p style={{ color: 'var(--text-medium)'}}>Could not load the exam review details.</p>
                {/* onBack prop'u varsa butonu göster */}
                {onBack && (
                     <button onClick={onBack} className="widget-button secondary" style={{ marginTop: '20px' }}>Back to History</button>
                )}
            </div>
        );
        // --- --- ---
    }
    // Destructure only after validation passes
    const { quizTitle, dateTaken, achievedPoints, totalPossiblePoints, questions } = examReviewData;

    // --- Helper Functions ---
    const renderAnswerStatusIcon = (isCorrect) => {
        return isCorrect ?
            <FontAwesomeIcon icon={faCheckCircle} className="answer-status correct" title="Correct Answer"/> :
            <FontAwesomeIcon icon={faTimesCircle} className="answer-status incorrect" title="Incorrect Answer"/>;
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return '-';
        try {
            const dateObj = new Date(dateString);
            if (isNaN(dateObj.getTime())) return 'Invalid Date';
            return dateObj.toLocaleString(navigator.language || 'en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
        } catch (e) { return 'Format Error'; }
    };

    const renderMCQOptions = (question) => {
        // question artık QuestionReviewDetailDto
        if (!question || question.type !== 'MCQ' || !Array.isArray(question.options)) {
             console.warn("Invalid data for rendering MCQ review:", question);
             return <p className="error-message" style={{ fontSize: '0.9em' }}>Could not display MCQ options.</p>;
        }
        const userAnswer = question.userAnswer;
        const correctAnswer = question.correctAnswer; // 'A', 'B', 'C', 'D' formatında olmalı

        return (
            <ul className="review-options-list">
                {question.options.map((option, index) => {
                    const optionLetter = String.fromCharCode(65 + index);
                    const isUserAnswer = userAnswer === optionLetter;
                    const isCorrectAnswer = correctAnswer === optionLetter;
                    const isWrongUserChoice = isUserAnswer && !isCorrectAnswer;

                    let liClassName = 'review-option-item';
                    if (isCorrectAnswer) liClassName += ' correct-option';
                    if (isUserAnswer && isCorrectAnswer) liClassName += ' user-correct';
                    if (isWrongUserChoice) liClassName += ' user-incorrect';

                    return (
                        <li key={`${question.id}_${optionLetter}`} className={liClassName}>
                            <strong className="option-letter">{optionLetter})</strong>
                            <span className="option-text">{option}</span>
                            {isWrongUserChoice && <FontAwesomeIcon icon={faTimesCircle} className="option-indicator incorrect" title="Your Answer" />}
                            {isUserAnswer && isCorrectAnswer && <FontAwesomeIcon icon={faCheckCircle} className="option-indicator correct" title="Your Answer (Correct)" />}
                            {isCorrectAnswer && !isUserAnswer && <span className="correct-indicator-text">(Correct Answer)</span>}
                        </li>
                    );
                })}
            </ul>
        );
    };

    // --- Main Component Render ---
    return (
        <div className="exam-review-page animated-fade-in-up">
            {/* Back Button */}
             {onBack && (
                 <div className="page-header-actions">
                    <button onClick={onBack} className="back-button-page">
                        <FontAwesomeIcon icon={faChevronLeft} /> Back to Exam History
                    </button>
                 </div>
             )}

            {/* Summary Card */}
            <div className="widget-card exam-summary-card">
                <h3>{quizTitle || "Exam Review"}</h3>
                <div className="summary-details">
                    <span><FontAwesomeIcon icon={faCalendarAlt} /> Completed: {formatDateTime(dateTaken)}</span>
                    <span>
                        <FontAwesomeIcon icon={faPercentage} /> Score:
                        <strong>{achievedPoints != null ? achievedPoints : '-'}</strong>
                        {totalPossiblePoints != null ? ` / ${totalPossiblePoints}` : ''} pts
                    </span>
                    {/* Status bilgisi backend DTO'dan gelmiyorsa kaldırılabilir */}
                    {/* {status && <span>Status: <span className={`status-chip ...`}>{status}</span></span>} */}
                </div>
            </div>

            {/* Questions Review Area */}
            <div className="questions-review-container">
                <h4 className="content-section-title"><FontAwesomeIcon icon={faQuestionCircle} /> Question Review ({questions.length} Questions)</h4>
                 {questions.length === 0 ? (
                     <p className="no-items-message widget-card">No questions found in this review.</p>
                 ) : (
                    questions.map((q, index) => {
                        if (!q || q.id == null) {
                            console.warn(`Skipping invalid question detail at index ${index}`);
                            return null;
                        }
                        const questionId = q.id.toString();

                        return (
                            <div key={questionId} className={`widget-card question-review-card animated-fade-in-up ${q.isCorrect == null ? '' : q.isCorrect ? 'correct-answer-card' : 'incorrect-answer-card'}`} style={{ animationDelay: `${index * 0.08}s` }}>
                                <div className="question-review-header">
                                     <div className="question-review-title">
                                         <strong>Question {index + 1}</strong>
                                         <span className="detail-chip type">{q.type || 'Unknown'}</span>
                                         {q.points != null && (
                                             <span className="detail-chip points">
                                                 <FontAwesomeIcon icon={faStar} /> {q.points} pts
                                             </span>
                                         )}
                                     </div>
                                     <div className="question-review-status">
                                         {q.isCorrect != null ? renderAnswerStatusIcon(q.isCorrect) : <FontAwesomeIcon icon={faInfoCircle} title="Evaluation Status Unknown"/>}
                                     </div>
                                 </div>
                                 <p className="question-review-text">{q.questiontitle || <span className="error-message">Question text missing!</span>}</p>
                                 <div className="answer-review-section">
                                     <h5 className="answer-review-heading"><FontAwesomeIcon icon={faCommentAlt}/> Your Answer vs. Correct Answer</h5>
                                     {q.type === 'MCQ' && renderMCQOptions(q)}
                                     {q.type === 'TF' && (
                                         <div className='tf-review answer-comparison'>
                                             <p><strong>Your Answer:</strong> <span className={q.isCorrect == null ? '' : q.isCorrect ? 'user-correct-text' : 'user-incorrect-text'}>{q.userAnswer || '-'}</span></p>
                                             {q.isCorrect === false && q.correctAnswer != null &&
                                                 <p><strong>Correct Answer:</strong> <span className='correct-answer-text'>{q.correctAnswer}</span></p>
                                             }
                                         </div>
                                     )}
                                     {q.type === 'Short Answer' && (
                                         <div className='short-answer-review answer-comparison'>
                                              <p><strong>Your Answer:</strong></p>
                                              <p className={`short-answer-box ${q.isCorrect == null ? '' : q.isCorrect ? 'user-correct-bg' : 'user-incorrect-bg'}`}>{q.userAnswer || '-'}</p>
                                              {q.isCorrect === false && q.correctAnswer != null &&
                                                  <>
                                                      <p><strong>Correct Answer:</strong></p>
                                                      <p className='short-answer-box correct-answer-bg'>{q.correctAnswer}</p>
                                                  </>
                                              }
                                          </div>
                                     )}
                                     {!['MCQ', 'TF', 'Short Answer'].includes(q.type) && q.type && (
                                         <p className="warning-message" style={{ fontSize: '0.9em' }}>Review display for type "{q.type}" is not fully supported.</p>
                                     )}
                                     {!q.type && (
                                         <p className="error-message" style={{ fontSize: '0.9em' }}>Question type is missing.</p>
                                     )}
                                 </div>
                            </div>
                        );
                    })
                )}
            </div>
            {/* Scoped Styles */}
            <style jsx>{`
                /* --- Review Page Specific Styles --- */
                .exam-review-page { width: 100%; }

                /* Error Placeholder */
                .loading-placeholder { /* Assuming this class exists in App.css */
                     text-align: center; padding: 40px 20px; color: var(--text-medium);
                }
                .loading-placeholder h4 { margin-bottom: 10px; color: var(--error-color); }
                .loading-placeholder p { font-size: 0.95rem; }

                /* Back Button Area */
                .page-header-actions { margin-bottom: 25px; }
                .back-button-page { /* Assuming styles exist in App.css */ }

                /* Summary Card */
                .exam-summary-card { margin-bottom: 30px; }
                .exam-summary-card h3 { margin-top: 0; margin-bottom: 15px; font-size: 1.5rem; border-bottom: 1px solid var(--border-light); padding-bottom: 12px; }
                .summary-details { display: flex; flex-wrap: wrap; gap: 15px 30px; font-size: 0.9rem; color: var(--text-medium); align-items: center; }
                .summary-details svg { margin-right: 8px; opacity: 0.8; font-size: 1em; }
                .summary-details strong { color: var(--text-light); font-weight: 600; margin: 0 3px; }
                .status-chip { /* Styles from App.css or ExamHistoryPage */ }
                .status-completed { background-color: rgba(100, 116, 139, 0.2); color: #94a3b8; }
                .status-passed { background-color: rgba(52, 211, 153, 0.15); color: #34d399; }
                .status-failed { background-color: var(--error-bg); color: var(--error-color); }

                /* Questions Area */
                .questions-review-container { display: flex; flex-direction: column; gap: 20px; }
                .content-section-title { font-size: 1.3rem; font-weight: 600; color: var(--text-light); margin-bottom: 20px; padding-bottom: 10px; border-bottom: 1px solid var(--border-light); display: flex; align-items: center; gap: 10px;}
                .no-items-message { /* Style for no questions message */
                    padding: 20px; text-align: center; color: var(--text-medium); font-style: italic;
                     background-color: var(--card-bg); /* Optionally give it a card background */
                     border: 1px solid var(--border-light);
                     border-radius: var(--border-radius-md);
                }

                /* Individual Question Card */
                .question-review-card { padding: 20px 25px; border-left: 4px solid var(--border-light); transition: border-color 0.3s; }
                .correct-answer-card { border-left-color: rgba(52, 211, 153, 0.6); }
                .incorrect-answer-card { border-left-color: rgba(248, 113, 113, 0.6); }

                .question-review-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid rgba(255, 255, 255, 0.07); }
                .question-review-title { font-size: 0.9rem; color: var(--text-medium); font-weight: 500; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
                .question-review-title strong { color: var(--text-light); font-weight: 600; margin-right: 5px; font-size: 1rem; }
                .detail-chip { font-size: 0.75rem; padding: 3px 8px; border-radius: var(--border-radius-sm); background-color: rgba(148, 163, 184, 0.15); color: var(--text-medium); white-space: nowrap; }
                .detail-chip.type { background-color: rgba(14, 165, 233, 0.1); color: var(--accent-primary); }
                .detail-chip.points { background-color: rgba(250, 204, 21, 0.1); color: #facc15; font-weight: 600; }
                .detail-chip.points svg { margin-right: 4px; font-size: 0.9em; }

                .question-review-status svg { font-size: 1.6rem; }
                .answer-status.correct { color: #34d399; }
                .answer-status.incorrect { color: var(--error-color); }

                .question-review-text { font-size: 1.05rem; color: var(--text-light); line-height: 1.6; margin-bottom: 20px; }

                /* Answer Section within Card */
                .answer-review-section { background-color: rgba(2, 6, 23, 0.3); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: var(--border-radius-sm); padding: 18px 22px; margin-top: 10px;}
                .answer-review-heading { font-size: 0.85rem; color: var(--text-medium); font-weight: 600; margin: 0 0 15px 0; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 8px; border-bottom: 1px solid rgba(255, 255, 255, 0.07); padding-bottom: 8px;}

                /* MCQ Review Styles */
                .review-options-list { list-style: none; padding: 0; margin: 0; font-size: 0.95rem; }
                .review-option-item { padding: 8px 10px; margin-bottom: 5px; border-radius: var(--border-radius-sm); border: 1px solid transparent; display: flex; align-items: center; gap: 10px; transition: background-color 0.2s; }
                .option-letter { font-weight: 600; color: var(--text-medium); min-width: 20px; text-align: right; }
                .option-text { flex-grow: 1; color: var(--text-light); }
                .option-indicator { margin-left: auto; font-size: 1.1rem; }
                .option-indicator.correct { color: #34d399; }
                .option-indicator.incorrect { color: var(--error-color); }
                .correct-indicator-text { margin-left: auto; font-size: 0.8rem; color: #34d399; font-style: italic; font-weight: 500; }
                .review-option-item.correct-option { background-color: rgba(52, 211, 153, 0.08); }
                .review-option-item.user-incorrect { background-color: rgba(248, 113, 113, 0.08); }
                .review-option-item.user-incorrect .option-text { text-decoration: line-through; opacity: 0.7; }

                /* TF / Short Answer Review Styles */
                .answer-comparison { font-size: 0.95rem; }
                .answer-comparison p { margin: 8px 0 12px 0; }
                .answer-comparison strong { color: var(--text-medium); font-weight: 600; min-width: 120px; display: inline-block; margin-right: 8px;}
                .user-correct-text { color: #34d399; font-weight: 500; }
                .user-incorrect-text { color: var(--error-color); font-weight: 500; }
                .correct-answer-text { color: #34d399; font-weight: 500; }

                .short-answer-box { display: block; width: fit-content; max-width: 100%; background-color: rgba(255, 255, 255, 0.04); padding: 10px 15px; border-radius: var(--border-radius-sm); border: 1px solid var(--border-light); color: var(--text-light); margin-top: 4px; font-family: monospace; line-height: 1.4; }
                .short-answer-box.user-incorrect-bg { border-color: var(--error-color); background-color: var(--error-bg); color: var(--error-color); }
                .short-answer-box.user-correct-bg { border-color: #34d399; background-color: rgba(52, 211, 153, 0.1); color: #34d399; }
                .short-answer-box.correct-answer-bg { border-color: rgba(52, 211, 153, 0.4); background-color: rgba(52, 211, 153, 0.05); color: var(--text-light); }

                /* Error/Warning Message Styling */
                .error-message, .warning-message { font-size: 0.9em; padding: 8px 12px; border-radius: var(--border-radius-sm); margin-top: 10px; }
                .error-message { color: var(--error-color); background-color: var(--error-bg); border: 1px solid var(--error-color); }
                .warning-message { color: #facc15; background-color: rgba(252, 211, 77, 0.1); border: 1px solid rgba(252, 211, 77, 0.5); }

                /* Responsive */
                @media (max-width: 768px) {
                    .summary-details { gap: 10px 20px; font-size: 0.85rem; }
                    .question-review-card { padding: 15px 20px; }
                    .question-review-header { flex-direction: column; align-items: stretch; gap: 8px; }
                    .question-review-status { align-self: flex-end; }
                    .question-review-text { font-size: 1rem; }
                    .answer-review-section { padding: 15px; }
                    .answer-comparison strong { display: block; margin-bottom: 3px; }
                }
            `}</style>
        </div>
    );
}

export default StudentExamReviewPage;
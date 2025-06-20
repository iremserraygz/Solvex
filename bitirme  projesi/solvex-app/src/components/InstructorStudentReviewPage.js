import React, { useState, useEffect } from 'react';
import '../App.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faChevronLeft, faCheckCircle, faTimesCircle, faPercentage,
    faCalendarAlt, faQuestionCircle, faCommentAlt,
    faExclamationTriangle, faStar, faSave, faEdit
} from '@fortawesome/free-solid-svg-icons';

function InstructorStudentReviewPage({ onBack, examReviewData, onUpdateTotalScore }) {
    const [editableScores, setEditableScores] = useState({});
    const [currentTotalAchievedPoints, setCurrentTotalAchievedPoints] = useState(0);
    const [isModified, setIsModified] = useState(false);

    useEffect(() => {
        if (examReviewData && examReviewData.questions) {
            const initialEditableScores = {};
            examReviewData.questions.forEach(q_review_detail => {
                initialEditableScores[q_review_detail.id.toString()] = q_review_detail.points ?? 0;
            });
            setEditableScores(initialEditableScores);
            setCurrentTotalAchievedPoints(examReviewData.achievedPoints ?? 0);
        } else {
            setEditableScores({});
            setCurrentTotalAchievedPoints(0);
        }
        setIsModified(false);
    }, [examReviewData]);

    if (!examReviewData || !examReviewData.submissionId || !Array.isArray(examReviewData.questions)) {
        return (
            <div className="loading-placeholder widget-card" style={{margin: '20px', textAlign: 'center'}}>
                <FontAwesomeIcon icon={faExclamationTriangle} size="2x" style={{ color: 'var(--error-color)', marginBottom: '15px' }}/>
                <h4>Error Loading Review</h4>
                <p style={{ color: 'var(--text-medium)'}}>Could not load the exam review details.</p>
                {onBack && ( <button onClick={onBack} className="widget-button secondary" style={{ marginTop: '20px' }}>Back</button> )}
            </div>
        );
    }

    const { submissionId, quizId, quizTitle, dateTaken, totalPossiblePoints, questions } = examReviewData;

    const handleScoreChange = (questionId, newScoreString) => {
        const questionReviewDetail = questions.find(q => q.id.toString() === questionId.toString());
        if (!questionReviewDetail) return;

        const maxPoints = questionReviewDetail.originalMaxPoints != null ? questionReviewDetail.originalMaxPoints : 0;
        let score;

        if (newScoreString === "") {
            score = 0; // Boş inputu 0 olarak kabul et
        } else {
            score = parseInt(newScoreString, 10);
            if (isNaN(score)) { // parseInt NaN döndürürse
                score = editableScores[questionId.toString()] ?? 0; // Eski değeri koru veya 0 yap
            } else if (score < 0) {
                score = 0;
            } else if (score > maxPoints) {
                score = maxPoints;
            }
        }

        const updatedEditableScores = {
            ...editableScores,
            [questionId.toString()]: score
        };
        setEditableScores(updatedEditableScores);

        let newTotal = 0;
        // Toplam puanı hesaplarken questions array'indeki her soru için editableScores'dan güncel puanı al
        questions.forEach(q_rd => {
            newTotal += (updatedEditableScores[q_rd.id.toString()] ?? 0);
        });
        setCurrentTotalAchievedPoints(newTotal);
        setIsModified(true);
    };

    const handleSaveChanges = () => {
        if (onUpdateTotalScore) {
            onUpdateTotalScore(submissionId, quizId, currentTotalAchievedPoints, editableScores);
            setIsModified(false);
        } else {
            console.error("onUpdateTotalScore prop is missing in InstructorStudentReviewPage");
            alert("Error: Score update functionality is not available.");
        }
    };

    const renderAnswerStatusIcon = (originalIsCorrect, earnedPoints, maxPointsForQuestion) => {
        if (maxPointsForQuestion > 0) {
            if (earnedPoints === maxPointsForQuestion) {
                return <FontAwesomeIcon icon={faCheckCircle} className="answer-status correct" title="Full Points Awarded"/>;
            } else if (earnedPoints > 0) {
                return <FontAwesomeIcon icon={faEdit} className="answer-status partial" title={`Partial Points Awarded (${earnedPoints}/${maxPointsForQuestion})`}/>;
            }
        }
        return originalIsCorrect ?
            <FontAwesomeIcon icon={faCheckCircle} className="answer-status correct" title="Originally Correct (Points may differ)"/> :
            <FontAwesomeIcon icon={faTimesCircle} className="answer-status incorrect" title="Originally Incorrect / No Points"/>;
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return '-';
        try { const dateObj = new Date(dateString); if (isNaN(dateObj.getTime())) return 'Invalid Date';
            return dateObj.toLocaleString(navigator.language || 'en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
        } catch (e) { return 'Format Error'; }
    };

    const renderMCQOptions = (questionReviewDetail) => {
        if (!questionReviewDetail || questionReviewDetail.type !== 'MCQ' || !Array.isArray(questionReviewDetail.options)) {
            return <p className="error-message" style={{ fontSize: '0.9em' }}>Could not display MCQ options.</p>;
        }
        const userAnswer = questionReviewDetail.userAnswer;
        const correctAnswerFromDto = questionReviewDetail.correctAnswer;

        return (
            <ul className="review-options-list">
                {questionReviewDetail.options.map((optionText, index) => {
                    const optionLetter = String.fromCharCode(65 + index);
                    const isUserAnswer = userAnswer === optionText || userAnswer === optionLetter;
                    const isCorrectActualAnswer = correctAnswerFromDto === optionText || correctAnswerFromDto === optionLetter;
                    let liClassName = 'review-option-item';
                    if (isCorrectActualAnswer) liClassName += ' correct-option';
                    if (isUserAnswer && questionReviewDetail.isCorrect) liClassName += ' user-correct';
                    if (isUserAnswer && !questionReviewDetail.isCorrect) liClassName += ' user-incorrect';
                    return (
                        <li key={`${questionReviewDetail.id}_${optionLetter}`} className={liClassName}>
                            <strong className="option-letter">{optionLetter})</strong>
                            <span className="option-text">{optionText}</span>
                            {isUserAnswer && !isCorrectActualAnswer && <FontAwesomeIcon icon={faTimesCircle} className="option-indicator incorrect" title="Your Answer" />}
                            {isUserAnswer && isCorrectActualAnswer && <FontAwesomeIcon icon={faCheckCircle} className="option-indicator correct" title="Your Answer (Correct)" />}
                            {isCorrectActualAnswer && !isUserAnswer && <span className="correct-indicator-text">(Correct Answer)</span>}
                        </li>
                    );
                })}
            </ul>
        );
    };

    return (
        <div className="instructor-student-review-page animated-fade-in-up" style={{padding: "20px"}}>
            {onBack && (
                <div className="page-header-actions">
                    <button onClick={onBack} className="back-button-page">
                        <FontAwesomeIcon icon={faChevronLeft} /> Back
                    </button>
                </div>
            )}

            <div className="widget-card exam-summary-card">
                <h3>Reviewing: {quizTitle || "Exam"}</h3>
                <div className="summary-details">
                    <span><FontAwesomeIcon icon={faCalendarAlt} /> Submitted: {formatDateTime(dateTaken)}</span>
                    <span>
                        <FontAwesomeIcon icon={faPercentage} /> Current Score:
                        <strong>{currentTotalAchievedPoints}</strong>
                        {totalPossiblePoints != null ? ` / ${totalPossiblePoints}` : ''} pts
                    </span>
                    {isModified && <span className="modified-indicator"><FontAwesomeIcon icon={faEdit} /> Scores Modified</span>}
                </div>
                {isModified && (
                    <div className="save-changes-action">
                        <button onClick={handleSaveChanges} className="widget-button primary large-button">
                            <FontAwesomeIcon icon={faSave} /> Update Scores & Total
                        </button>
                    </div>
                )}
            </div>

            <div className="questions-review-container">
                <h4 className="content-section-title">
                    <FontAwesomeIcon icon={faQuestionCircle} /> Question Details ({questions.length} Questions)
                </h4>
                {questions.length === 0 ? (
                    <p className="no-items-message widget-card">No questions found in this submission.</p>
                ) : (
                    questions.map((q_review_detail, index) => {
                        if (!q_review_detail || q_review_detail.id == null) return null;
                        const questionIdStr = q_review_detail.id.toString();
                        const currentQuestionMaxPoints = q_review_detail.originalMaxPoints != null ? q_review_detail.originalMaxPoints : 0;
                        const currentEarnedPoints = editableScores[questionIdStr] ?? 0;

                        let cardClass = 'question-review-card animated-fade-in-up';
                        if (currentQuestionMaxPoints > 0) {
                            if (currentEarnedPoints === currentQuestionMaxPoints) { cardClass += ' correct-answer-card'; }
                            else if (currentEarnedPoints === 0 && !q_review_detail.isCorrect) { cardClass += ' incorrect-answer-card'; }
                            else if (editableScores[questionIdStr] !== undefined && editableScores[questionIdStr] !== (q_review_detail.isCorrect ? currentQuestionMaxPoints : 0) ) { cardClass += ' modified-score-card'; }
                        } else if (editableScores[questionIdStr] !== undefined && editableScores[questionIdStr] !== 0) { // Max puan 0 ise ve değiştirilmişse
                            cardClass += ' modified-score-card';
                        }


                        return (
                            <div key={questionIdStr} className={cardClass} style={{ animationDelay: `${index * 0.08}s` }}>
                                <div className="question-review-header">
                                    <div className="question-review-title">
                                        <strong>Question {index + 1}</strong>
                                        <span className="detail-chip type">{q_review_detail.type || 'N/A'}</span>
                                        <span className="detail-chip points">Max: <FontAwesomeIcon icon={faStar}/> {currentQuestionMaxPoints} pts</span>
                                    </div>
                                    <div className="score-editor">
                                        <label htmlFor={`score-${questionIdStr}`}>Earned:</label>
                                        <input
                                            type="number"
                                            id={`score-${questionIdStr}`}
                                            value={editableScores[questionIdStr] ?? ''}
                                            onChange={(e) => handleScoreChange(questionIdStr, e.target.value)}
                                            min="0"
                                            max={currentQuestionMaxPoints}
                                            className="input-field score-input"
                                            placeholder="0"
                                        />
                                        <span style={{whiteSpace: "nowrap"}}>/ {currentQuestionMaxPoints} pts</span>
                                        {renderAnswerStatusIcon(q_review_detail.isCorrect, currentEarnedPoints, currentQuestionMaxPoints)}
                                    </div>
                                </div>
                                <p className="question-review-text">{q_review_detail.questiontitle || "Question text missing!"}</p>
                                <div className="answer-review-section">
                                    <h5 className="answer-review-heading"><FontAwesomeIcon icon={faCommentAlt}/> Student's Answer vs. Correct Answer</h5>
                                    {q_review_detail.type === 'MCQ' && renderMCQOptions(q_review_detail)}
                                    {q_review_detail.type === 'TF' && (
                                        <div className='tf-review answer-comparison'>
                                            <p><strong>Student's Answer:</strong> <span className={q_review_detail.isCorrect ? 'user-correct-text' : 'user-incorrect-text'}>{q_review_detail.userAnswer || '-'}</span></p>
                                            {!q_review_detail.isCorrect && q_review_detail.correctAnswer != null && <p><strong>Correct Answer:</strong> <span className='correct-answer-text'>{q_review_detail.correctAnswer}</span></p>}
                                        </div>
                                    )}
                                    {q_review_detail.type === 'Short Answer' && (
                                        <div className='short-answer-review answer-comparison'>
                                            <p><strong>Student's Answer:</strong></p>
                                            <p className={`short-answer-box ${q_review_detail.isCorrect ? 'user-correct-bg' : 'user-incorrect-bg'}`}>{q_review_detail.userAnswer || '-'}</p>
                                            {!q_review_detail.isCorrect && q_review_detail.correctAnswer != null && <> <p><strong>Correct Answer:</strong></p> <p className='short-answer-box correct-answer-bg'>{q_review_detail.correctAnswer}</p> </>}
                                        </div>
                                    )}
                                    {!['MCQ', 'TF', 'Short Answer'].includes(q_review_detail.type) && q_review_detail.type && (<p className="warning-message">Review for "{q_review_detail.type}" is not fully detailed.</p>)}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
            <style jsx>{`
                .instructor-student-review-page { padding: 20px; }
                .exam-summary-card .save-changes-action { margin-top: 15px; text-align: right; }
                .exam-summary-card .large-button { padding: 10px 25px; font-size: 0.95rem; }
                .modified-indicator { color: var(--accent-primary); font-style: italic; font-size: 0.85em; margin-left: 15px; }
                .question-review-card.modified-score-card { border-left-color: var(--accent-primary) !important; }
                .score-editor { display: flex; align-items: center; gap: 8px; font-size: 0.9rem; }
                .score-editor label { color: var(--text-medium); font-weight: 500; white-space: nowrap; }
                .score-input { width: 70px; padding: 6px 10px; font-size: 0.9rem; text-align: center; background-color: rgba(255,255,255,0.1); border: 1px solid var(--border-light); color: var(--text-light); border-radius: var(--border-radius-sm); }
                .score-input:focus { border-color: var(--accent-primary); background-color: rgba(255,255,255,0.15); }
                .answer-status { font-size: 1.2rem; margin-left: 10px; }
                .answer-status.correct { color: #34d399; }
                .answer-status.incorrect { color: var(--error-color); }
                .answer-status.partial { color: #facc15; }
                .answer-status.modified-correct-to-zero { color: #94a3b8; }
                .page-header-actions { margin-bottom: 25px; }
                .exam-summary-card h3 { margin-top: 0; margin-bottom: 15px; font-size: 1.5rem; border-bottom: 1px solid var(--border-light); padding-bottom: 12px; }
                .summary-details { display: flex; flex-wrap: wrap; gap: 15px 30px; font-size: 0.9rem; color: var(--text-medium); align-items: center; }
                .summary-details svg { margin-right: 8px; opacity: 0.8; font-size: 1em; }
                .summary-details strong { color: var(--text-light); font-weight: 600; margin: 0 3px; }
                .questions-review-container { display: flex; flex-direction: column; gap: 20px; }
                .content-section-title { font-size: 1.3rem; font-weight: 600; color: var(--text-light); margin-bottom: 20px; padding-bottom: 10px; border-bottom: 1px solid var(--border-light); display: flex; align-items: center; gap: 10px;}
                .no-items-message { padding: 20px; text-align: center; color: var(--text-medium); font-style: italic; background-color: var(--card-bg); border: 1px solid var(--border-light); border-radius: var(--border-radius-md); }
                .question-review-card { padding: 20px 25px; border-left: 4px solid var(--border-light); transition: border-color 0.3s; }
                .correct-answer-card { border-left-color: rgba(52, 211, 153, 0.6) !important; }
                .incorrect-answer-card { border-left-color: rgba(248, 113, 113, 0.6) !important; }
                .question-review-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid rgba(255, 255, 255, 0.07); flex-wrap: wrap; gap: 10px; }
                .question-review-title { font-size: 0.9rem; color: var(--text-medium); font-weight: 500; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; flex-grow: 1; }
                .question-review-title strong { color: var(--text-light); font-weight: 600; margin-right: 5px; font-size: 1rem; }
                .detail-chip { font-size: 0.75rem; padding: 3px 8px; border-radius: var(--border-radius-sm); background-color: rgba(148, 163, 184, 0.15); color: var(--text-medium); white-space: nowrap; }
                .detail-chip.type { background-color: rgba(14, 165, 233, 0.1); color: var(--accent-primary); }
                .detail-chip.points { background-color: rgba(250, 204, 21, 0.1); color: #facc15; font-weight: 600; }
                .detail-chip.points svg { margin-right: 4px; font-size: 0.9em; }
                .question-review-text { font-size: 1.05rem; color: var(--text-light); line-height: 1.6; margin-bottom: 20px; }
                .answer-review-section { background-color: rgba(2, 6, 23, 0.3); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: var(--border-radius-sm); padding: 18px 22px; margin-top: 10px;}
                .answer-review-heading { font-size: 0.85rem; color: var(--text-medium); font-weight: 600; margin: 0 0 15px 0; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 8px; border-bottom: 1px solid rgba(255, 255, 255, 0.07); padding-bottom: 8px;}
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
                .answer-comparison { font-size: 0.95rem; }
                .answer-comparison p { margin: 8px 0 12px 0; }
                .answer-comparison strong { color: var(--text-medium); font-weight: 600; min-width: 120px; display: inline-block; margin-right: 8px;}
                .user-correct-text { color: #34d399; font-weight: 500; }
                .user-incorrect-text { color: var(--error-color); font-weight: 500; }
                .correct-answer-text { color: #34d399; font-weight: 500; }
                .short-answer-box { display: block; width: fit-content; max-width: 100%; background-color: rgba(255, 255, 255, 0.04); padding: 10px 15px; border-radius: var(--border-radius-sm); border: 1px solid var(--border-light); color: var(--text-light); margin-top: 4px; font-family: monospace; line-height: 1.4; }
                .short-answer-box.user-incorrect-bg { border-left: 3px solid var(--error-color); background-color: var(--error-bg); color: var(--text-light); }
                .short-answer-box.user-correct-bg { border-left: 3px solid #34d399; background-color: rgba(52, 211, 153, 0.1); color: var(--text-light); }
                .short-answer-box.correct-answer-bg { border-left: 3px solid rgba(52, 211, 153, 0.4); background-color: rgba(52, 211, 153, 0.05); color: var(--text-light); }
                .warning-message, .error-message { font-size: 0.9em; padding: 8px 12px; border-radius: var(--border-radius-sm); margin-top: 10px; }
                .warning-message { color: #facc15; background-color: rgba(252, 211, 77, 0.1); border: 1px solid rgba(252, 211, 77, 0.5); }
                .error-message { color: var(--error-color); background-color: var(--error-bg); border: 1px solid var(--error-color); }
            `}</style>
        </div>
    );
}

export default InstructorStudentReviewPage;
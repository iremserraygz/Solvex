import React from 'react';
import '../App.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faChevronLeft, faCheckCircle, faTimesCircle, faPercentage,
    faCalendarAlt, faInfoCircle, faQuestionCircle, faCommentAlt,
    faExclamationTriangle, faStar, faEdit
} from '@fortawesome/free-solid-svg-icons';

function StudentExamReviewPage({ onBack, examReviewData }) {

    if (!examReviewData || !examReviewData.submissionId || !Array.isArray(examReviewData.questions)) {
        return (
            <div className="loading-placeholder widget-card" style={{ margin: '20px', textAlign: 'center' }}>
                <FontAwesomeIcon icon={faExclamationTriangle} size="2x" style={{ color: 'var(--error-color)', marginBottom: '15px' }}/>
                <h4>Error Loading Review</h4>
                <p style={{ color: 'var(--text-medium)'}}>Could not load the exam review details.</p>
                {onBack && ( <button onClick={onBack} className="widget-button secondary" style={{ marginTop: '20px' }}>Back to History</button> )}
            </div>
        );
    }

    const { quizTitle, dateTaken, achievedPoints, totalPossiblePoints, questions } = examReviewData;

    const renderAnswerStatusIcon = (isCorrectOriginalEval, earnedPoints, maxPoints) => {

        const wasOriginallyCorrect = isCorrectOriginalEval;
        const isNowFullPoints = maxPoints > 0 && earnedPoints === maxPoints;
        const isNowPartialPoints = maxPoints > 0 && earnedPoints > 0 && earnedPoints < maxPoints;
        const isNowZeroPoints = earnedPoints === 0;

        let icon = faInfoCircle;
        let title = "Evaluation Status";
        let className = "answer-status other"; // Default

        if (isNowFullPoints) {
            icon = faCheckCircle;
            className = "answer-status correct";
            title = "Full Points Awarded";
            if (!wasOriginallyCorrect && maxPoints > 0) {
                title += " (Manually Overridden)";
            }
        } else if (isNowPartialPoints) {
            icon = faEdit; // Kısmi puan için edit ikonu
            className = "answer-status partial";
            title = `Partial Points Awarded (${earnedPoints}/${maxPoints})`;
        } else if (isNowZeroPoints) {
            if (wasOriginallyCorrect && maxPoints > 0) {
                icon = faEdit;
                className = "answer-status modified-correct-to-zero";
                title = "Originally Correct, Awarded 0 Points (Manually Overridden)";
            } else { // Orijinalde de yanlıştı veya puanı yoktu
                icon = faTimesCircle;
                className = "answer-status incorrect";
                title = "Incorrect / No Points";
            }
        }
        return <FontAwesomeIcon icon={icon} className={className} title={title}/>;
    };


    const formatDateTime = (dateString) => {
        if (!dateString) return '-';
        try { const dateObj = new Date(dateString); if (isNaN(dateObj.getTime())) return 'Invalid Date';
            return dateObj.toLocaleString(navigator.language || 'en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
        } catch (e) { return 'Format Error'; }
    };

    const renderMCQOptions = (questionDetail) => {
        if (!questionDetail || questionDetail.type !== 'MCQ' || !Array.isArray(questionDetail.options)) {
            return <p className="error-message" style={{ fontSize: '0.9em' }}>Could not display MCQ options.</p>;
        }
        const userAnswer = questionDetail.userAnswer; // Öğrencinin cevabı
        const correctAnswerFromDto = questionDetail.correctAnswer; // Doğru cevap

        return (
            <ul className="review-options-list">
                {questionDetail.options.map((optionText, index) => {
                    const optionLetter = String.fromCharCode(65 + index);
                    const isUserAnswer = userAnswer === optionText || userAnswer === optionLetter;
                    const isCorrectActualAnswer = correctAnswerFromDto === optionText || correctAnswerFromDto === optionLetter;

                    let liClassName = 'review-option-item';
                    if (isCorrectActualAnswer) liClassName += ' correct-option';
                    if (isUserAnswer && isCorrectActualAnswer) liClassName += ' user-correct';
                    if (isUserAnswer && !isCorrectActualAnswer) liClassName += ' user-incorrect';

                    return (
                        <li key={`${questionDetail.id}_${optionLetter}`} className={liClassName}>
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
        <div className="student-exam-review-page animated-fade-in-up" style={{padding: "20px"}}>
            {onBack && (
                <div className="page-header-actions">
                    <button onClick={onBack} className="back-button-page">
                        <FontAwesomeIcon icon={faChevronLeft} /> Back to Exam History
                    </button>
                </div>
            )}

            <div className="widget-card exam-summary-card">
                <h3>{quizTitle || "Exam Review"}</h3>
                <div className="summary-details">
                    <span><FontAwesomeIcon icon={faCalendarAlt} /> Completed: {formatDateTime(dateTaken)}</span>
                    <span>
                        <FontAwesomeIcon icon={faPercentage} /> Score:
                        <strong>{achievedPoints != null ? achievedPoints : '-'}</strong>
                        {totalPossiblePoints != null ? ` / ${totalPossiblePoints}` : ''} pts
                    </span>
                </div>
            </div>

            <div className="questions-review-container">
                <h4 className="content-section-title"><FontAwesomeIcon icon={faQuestionCircle} /> Question Review ({questions.length} Questions)</h4>
                {questions.length === 0 ? (
                    <p className="no-items-message widget-card">No questions found in this review.</p>
                ) : (
                    questions.map((q_detail, index) => { // q_detail QuestionReviewDetailDto'dan gelen soru
                        if (!q_detail || q_detail.id == null) return null;
                        const questionIdStr = q_detail.id.toString();

                        const earnedPointsForThisQuestion = q_detail.points ?? 0;
                        const maxPointsForThisQuestion = q_detail.originalMaxPoints ?? 0;

                        let cardClass = 'question-review-card animated-fade-in-up';
                        // Kart rengini, kazanılan puana ve max puana göre belirle
                        if (maxPointsForThisQuestion > 0) {
                            if (earnedPointsForThisQuestion === maxPointsForThisQuestion) {
                                cardClass += ' correct-answer-card';
                            } else if (earnedPointsForThisQuestion === 0) {
                                cardClass += ' incorrect-answer-card';
                            } else if (earnedPointsForThisQuestion > 0 && earnedPointsForThisQuestion < maxPointsForThisQuestion) {
                                cardClass += ' partial-score-card';
                            }
                        }
                        // Eğer orijinal değerlendirme ile kazanılan puan arasında fark varsa (eğitmen değiştirmişse)
                        // q_detail.isCorrect (orijinal otomatik değerlendirme)
                        const wasOriginallyCorrect = q_detail.isCorrect;
                        const isNowConsideredCorrect = maxPointsForThisQuestion > 0 && earnedPointsForThisQuestion === maxPointsForThisQuestion;
                        if (wasOriginallyCorrect !== isNowConsideredCorrect && (earnedPointsForThisQuestion !== (wasOriginallyCorrect ? maxPointsForThisQuestion : 0) ) ) {
                            // Eğer puan manuel olarak değiştirildiyse ve orijinal değerlendirmeden farklıysa
                            cardClass += ' modified-score-card';
                        }


                        return (
                            <div key={questionIdStr} className={cardClass} style={{ animationDelay: `${index * 0.08}s` }}>
                                <div className="question-review-header">
                                    <div className="question-review-title">
                                        <strong>Question {index + 1}</strong>
                                        <span className="detail-chip type">{q_detail.type || 'N/A'}</span>
                                        {/* Kazanılan puanı ve max puanı göster */}
                                        <span className="detail-chip points">
                                            <FontAwesomeIcon icon={faStar}/> {earnedPointsForThisQuestion} / {maxPointsForThisQuestion} pts
                                         </span>
                                    </div>
                                    <div className="question-review-status">
                                        {renderAnswerStatusIcon(q_detail.isCorrect, earnedPointsForThisQuestion, maxPointsForThisQuestion)}
                                    </div>
                                </div>
                                <p className="question-review-text">{q_detail.questiontitle || "Question text missing!"}</p>
                                <div className="answer-review-section">
                                    <h5 className="answer-review-heading"><FontAwesomeIcon icon={faCommentAlt}/> Your Answer vs. Correct Answer</h5>
                                    {q_detail.type === 'MCQ' && renderMCQOptions(q_detail)}
                                    {q_detail.type === 'TF' && (
                                        <div className='tf-review answer-comparison'>
                                            <p><strong>Your Answer:</strong> <span className={q_detail.isCorrect ? 'user-correct-text' : 'user-incorrect-text'}>{q_detail.userAnswer || '-'}</span></p>
                                            {!q_detail.isCorrect && q_detail.correctAnswer != null &&
                                                <p><strong>Correct Answer:</strong> <span className='correct-answer-text'>{q_detail.correctAnswer}</span></p>
                                            }
                                        </div>
                                    )}
                                    {q_detail.type === 'Short Answer' && (
                                        <div className='short-answer-review answer-comparison'>
                                            <p><strong>Your Answer:</strong></p>
                                            <p className={`short-answer-box ${q_detail.isCorrect ? 'user-correct-bg' : 'user-incorrect-bg'}`}>{q_detail.userAnswer || '-'}</p>
                                            {!q_detail.isCorrect && q_detail.correctAnswer != null &&
                                                <>
                                                    <p><strong>Correct Answer:</strong></p>
                                                    <p className='short-answer-box correct-answer-bg'>{q_detail.correctAnswer}</p>
                                                </>
                                            }
                                        </div>
                                    )}
                                    {!['MCQ', 'TF', 'Short Answer'].includes(q_detail.type) && q_detail.type && (
                                        <p className="warning-message" style={{ fontSize: '0.9em' }}>Review display for type "{q_detail.type}" is not fully supported.</p>
                                    )}
                                    {!q_detail.type && (
                                        <p className="error-message" style={{ fontSize: '0.9em' }}>Question type is missing.</p>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
            <style jsx>{`
                .student-exam-review-page { padding: 20px; }
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
                .partial-score-card { border-left-color: #facc15 !important; /* Sarı - Kısmi puan için */ }
                .modified-score-card { border-left-color: var(--accent-primary) !important; /* Eğitmen değiştirdiyse */ }
                .question-review-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid rgba(255, 255, 255, 0.07); flex-wrap: wrap; gap: 10px; }
                .question-review-title { font-size: 0.9rem; color: var(--text-medium); font-weight: 500; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; flex-grow: 1; }
                .question-review-title strong { color: var(--text-light); font-weight: 600; margin-right: 5px; font-size: 1rem; }
                .detail-chip { font-size: 0.75rem; padding: 3px 8px; border-radius: var(--border-radius-sm); background-color: rgba(148, 163, 184, 0.15); color: var(--text-medium); white-space: nowrap; }
                .detail-chip.type { background-color: rgba(14, 165, 233, 0.1); color: var(--accent-primary); }
                .detail-chip.points { background-color: rgba(250, 204, 21, 0.1); color: #facc15; font-weight: 600; }
                .detail-chip.points svg { margin-right: 4px; font-size: 0.9em; }
                .question-review-status { display: flex; align-items: center; }
                .answer-status { font-size: 1.2rem; margin-left: 10px; }
                .answer-status.correct { color: #34d399; }
                .answer-status.incorrect { color: var(--error-color); }
                .answer-status.partial { color: #facc15; }
                .answer-status.modified-correct-to-zero { color: #94a3b8; }
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

export default StudentExamReviewPage;
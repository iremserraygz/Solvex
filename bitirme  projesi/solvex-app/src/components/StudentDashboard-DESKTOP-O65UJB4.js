import React, { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import '../App.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faFileAlt, faHistory, faSignOutAlt, faUserGraduate,
    faSpinner, faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';

import ExamHistoryPage from './ExamHistoryPage';
import StudentExamsPage from './StudentExamsPage';
import StudentExamReviewPage from './StudentExamReviewPage';
import ExamTakingPage from './ExamTakingPage';
import ProfileDropdown from './ProfileDropdown';

// localStorage anahtar fonksiyonları (StudentExamsPage ve ExamTakingPage için)
export const getExamAttemptStatusKey = (userId, quizId) => `examAttemptStatus_${userId}_${quizId}`;
const getInProgressExamKey = (userId, quizId) => `inProgressQuizSession_${userId}_${quizId}`;

const QUIZ_API_BASE_URL = process.env.REACT_APP_QUIZ_SERVICE_URL || 'http://localhost:8083/quiz';


function StudentDashboard({ user, onLogout, onChangePassword, onChangeEmail, onChangeFullName }) {
    const [studentView, setStudentView] = useState('exams');
    const [examToTake, setExamToTake] = useState(null);
    const [examHistory, setExamHistory] = useState([]);
    const [reviewDataToShow, setReviewDataToShow] = useState(null);
    const [selectedHistoryItemId,  setSelectedHistoryItemId] = useState(null);
    const [isLoadingExam, setIsLoadingExam] = useState(false);
    const [examLoadError, setExamLoadError] = useState(null);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [historyLoadError, setHistoryLoadError] = useState(null);
    const [isLoadingReview, setIsLoadingReview] = useState(false);
    const [reviewLoadError, setReviewLoadError] = useState(null);
    const [refreshHistoryToggle, setRefreshHistoryToggle] = useState(false);
    const [availableExams, setAvailableExams] = useState([]);
    const [isLoadingAvailableExams, setIsLoadingAvailableExams] = useState(false);
    const [availableExamsError, setAvailableExamsError] = useState(null);
    const [refreshAvailableToggle, setRefreshAvailableToggle] = useState(false);

    const isTakingExam = studentView === 'takingExam';
    const genelYuklemeDurumu = isLoadingExam || isLoadingReview || isLoadingAvailableExams || isLoadingHistory;

    useEffect(() => {
    }, [studentView]);

    useEffect(() => {
        if (studentView === 'examHistory' && user?.id) {
            const fetchHistory = async () => {
                setIsLoadingHistory(true); setHistoryLoadError(null);
                try {
                    const response = await axios.get(`${QUIZ_API_BASE_URL}/history`, { params: { userId: user.id }, withCredentials: true });
                    if (Array.isArray(response.data)) {
                        const formattedHistory = response.data.map((item, index) => {
                            let uniqueKeyPart;
                            if (item.submissionId != null) {
                                uniqueKeyPart = `sub-${item.submissionId}`;
                            } else if (item.id != null) {
                                uniqueKeyPart = `quiz-${item.id}`;
                            } else {
                                uniqueKeyPart = `item-idx-${index}`;
                            }
                            return {
                                uniqueListId: uniqueKeyPart,
                                id: item.submissionId?.toString(),
                                examId: item.id,
                                submissionId: item.submissionId,
                                title: item.title ?? 'Untitled Exam',
                                description: item.description ?? '',
                                dateTaken: item.dateTaken,
                                score: item.score,
                                studentStatus: item.studentStatus ?? 'COMPLETED',
                                durationMinutes: item.durationMinutes,
                                totalPoints: item.totalPoints,
                                reviewAvailable: true,
                                status: item.status
                            };
                        });
                        setExamHistory(formattedHistory);
                    } else { throw new Error("Invalid history data format from server."); }
                } catch (err) {
                    let message = "Could not load exam history.";
                    if (err.response) { message = `Error ${err.response.status}: ${err.response.data?.message || 'Could not fetch history.'}`; }
                    else if (err.request) { message = "Cannot connect to server for history."; }
                    else { message = `Error: ${err.message}`; }
                    setHistoryLoadError(message); setExamHistory([]);
                } finally { setIsLoadingHistory(false); }
            };
            fetchHistory();
        }
    }, [studentView, refreshHistoryToggle, user?.id]);

    useEffect(() => {
        if (studentView === 'exams' && user?.id) {
            const fetchAvailable = async () => {
                setIsLoadingAvailableExams(true); setAvailableExamsError(null); setAvailableExams([]);
                try {
                    const response = await axios.get(`${QUIZ_API_BASE_URL}/available`, { params: { userId: user.id }, withCredentials: true });
                    if (Array.isArray(response.data)) { setAvailableExams(response.data); }
                    else { throw new Error("Invalid available exams data format received."); }
                } catch (err) {
                    let message = "Could not load available exams.";
                    if (err.response) { message = `Error ${err.response.status}: ${err.response.data?.message || 'Could not load exams.'}`; }
                    else if (err.request) { message = "Cannot connect to the server for exams."; }
                    else { message = `Error: ${err.message}`; }
                    setAvailableExamsError(message);
                } finally { setIsLoadingAvailableExams(false); }
            };
            fetchAvailable();
        }
    }, [studentView, user?.id, refreshAvailableToggle]);

    const handleMenuClick = useCallback((viewName) => {
        if (isTakingExam) {
            alert("Please finish your current exam before navigating away.");
            return;
        }
        if (genelYuklemeDurumu) return;
        setStudentView(viewName); setExamToTake(null); setSelectedHistoryItemId(null); setReviewDataToShow(null);
        setExamLoadError(null); setHistoryLoadError(null); setReviewLoadError(null); setAvailableExamsError(null);
    }, [isTakingExam, genelYuklemeDurumu]);

    const handleNavigateToTakeExam = useCallback(async (quizId) => {
        if (!user?.id) {
            alert("User information missing. Cannot start exam.");
            return;
        }
        if (!quizId || isLoadingExam) return;



        setIsLoadingExam(true); setExamLoadError(null); setExamToTake(null);
        try {
            const response = await axios.get(`${QUIZ_API_BASE_URL}/getQuestions/${quizId}`, { withCredentials: true });

            if (response.status === 409) {
                throw new Error(response.data?.message || "An active session for this exam already exists (checked by backend).");
            }

            if (!response.data?.quizId || !Array.isArray(response.data.questions)) { throw new Error("Invalid exam data structure received from server."); }
            if (!response.data.durationMinutes || response.data.durationMinutes <= 0) { throw new Error(`Exam "${response.data.title || 'Unknown'}" has an invalid duration.`); }
            if (response.data.questions.length === 0) { throw new Error(`Exam "${response.data.title || 'Unknown'}" contains no questions.`); }
            const firstInvalidQ = response.data.questions.find(q => q?.id == null || q?.type == null || q?.questiontitle == null || q?.points == null);
            if (firstInvalidQ) { throw new Error("Incomplete question data received."); }



            setExamToTake({...response.data });
            setStudentView('takingExam');
        } catch (err) {
            let message = err.message || "Could not load the exam details.";
            if (err.response) {
                if (err.response.status === 409) {
                    message = err.response.data?.message || "An active session for this exam already exists. Please close other sessions.";
                } else {
                    message = `Error ${err.response.status}: Could not load exam. ${err.response.data?.message || ''}`;
                }
            } else if (err.request) {
                message = "Cannot connect to the server to load the exam.";
            }
            setExamLoadError(message);
            setStudentView('exams');

        } finally {
            setIsLoadingExam(false);
        }
    }, [isLoadingExam, user]);

    const handleViewExamReview = useCallback(async (submissionId) => {
        if (!user?.id) { alert("User ID not found. Cannot fetch review."); return; }
        if (!submissionId) { console.error("[StudentDashboard] handleViewExamReview called without submissionId!"); return; }
        setIsLoadingReview(true); setReviewLoadError(null); setReviewDataToShow(null); setSelectedHistoryItemId(submissionId);
        const url = `${QUIZ_API_BASE_URL}/submission/${submissionId}/details`;
        try {
            const response = await axios.get(url, { params: { userId: user.id }, withCredentials: true });
            if (response.data && response.data.submissionId && Array.isArray(response.data.questions)) {
                setReviewDataToShow(response.data); setStudentView('examReview');
            } else { throw new Error("Invalid review data received from the server."); }
        } catch (err) {
            let message = "Could not load exam review details.";
            if (err.response) { if (err.response.status === 403) { message = "You do not have permission to view this review."; } else if (err.response.status === 404) { message = "Exam review not found."; } else { message = `Error ${err.response.status}: ${err.response.data?.message || 'Could not fetch review.'}`; } }
            else if (err.request) { message = "Cannot connect to the server to fetch the review."; }
            else { message = `Unexpected error: ${err.message}`; }
            setReviewLoadError(message); setStudentView('examHistory');
        } finally { setIsLoadingReview(false); }
    }, [user?.id]);

    const handleBackFromReview = useCallback(() => {
        setSelectedHistoryItemId(null); setReviewDataToShow(null); setReviewLoadError(null);
        setStudentView('examHistory'); setExamLoadError(null); setAvailableExamsError(null);
    }, []);

    const handleFinishExam = useCallback(async (finishedQuizId, submittedAnswers) => {
        if (!user || !user.id) {
            console.error("[StudentDashboard] User ID is missing. Cannot submit exam.");
            alert("Critical Error: User information is missing. Cannot submit exam.");
            handleMenuClick('exams');
            return Promise.reject(new Error("User ID missing"));
        }

        setExamLoadError(null);

        const responsesPayload = Object.entries(submittedAnswers).map(([key, value]) => ({ id: parseInt(key, 10), response: value }));
        const LSK_SessionData_Key = getInProgressExamKey(user.id, finishedQuizId);
        const LSK_AttemptStatus_Key = getExamAttemptStatusKey(user.id, finishedQuizId);

        try {
            const response = await axios.post(
                `${QUIZ_API_BASE_URL}/submit/${finishedQuizId}`,
                responsesPayload,
                { params: { userId: user.id }, withCredentials: true }
            );
            const submissionResult = response.data;

            if (LSK_SessionData_Key) localStorage.removeItem(LSK_SessionData_Key);
            if (LSK_AttemptStatus_Key) localStorage.setItem(LSK_AttemptStatus_Key, 'SUBMITTED');

            alert(`Exam submitted successfully! Your score: ${submissionResult?.achievedPoints ?? 'N/A'} / ${submissionResult?.totalPossiblePoints ?? 'N/A'}. Check your history.`);
            setExamToTake(null);
            setStudentView('examHistory');
            setRefreshHistoryToggle(prev => !prev);
            setRefreshAvailableToggle(prev => !prev);
            return Promise.resolve(submissionResult);
        } catch (err) {
            let message = "Failed to submit exam results to the server.";
            if (err.response) { message += ` (Server Error: ${err.response.status} - ${err.response.data?.message || err.response.data || ''})`; }
            else if (err.request) { message += " (Could not connect to server)."; }
            else { message += ` (${err.message})`; }

            alert(`Submission Error: ${message}. Your progress has been saved. If the problem persists, contact support.`);

            if (LSK_SessionData_Key) {
                try {
                    const currentDataStr = localStorage.getItem(LSK_SessionData_Key);
                    if (currentDataStr) {
                        const currentData = JSON.parse(currentDataStr);
                        if (currentData.status === 'submitting') { // Sadece 'submitting' durumundaysa 'session_active'e geri al
                            localStorage.setItem(LSK_SessionData_Key, JSON.stringify({
                                ...currentData,
                                status: 'session_active'
                            }));
                        }
                    }
                } catch (e) {
                    console.error("[StudentDashboard] Error resetting LSK_SessionData status after API failure:", e);
                }
            }
            return Promise.reject(new Error(message));
        }
    }, [user, handleMenuClick]);

    const renderStudentContent = () => {
        if (studentView === 'exams' && availableExamsError) { return <div className="error-message-container widget-card"><FontAwesomeIcon icon={faExclamationTriangle} size="2x" style={{ color: 'var(--error-color)', marginBottom: '15px' }}/><h4>Error Loading Exams</h4><p style={{ color: 'var(--text-medium)' }}>{availableExamsError}</p><button onClick={() => { setAvailableExamsError(null); setRefreshAvailableToggle(p=>!p); }} className="widget-button secondary">Retry</button></div>; }
        if (studentView === 'examHistory' && historyLoadError) { return <div className="error-message-container widget-card">Error loading history: {historyLoadError}<button onClick={() => { setHistoryLoadError(null); setRefreshHistoryToggle(p=>!p); }} className="widget-button secondary">Retry</button></div>; }
        if (studentView === 'examReview' && reviewLoadError) { return <div className="error-message-container widget-card">Error loading review: {reviewLoadError}<button onClick={handleBackFromReview} className="widget-button secondary" style={{marginTop: '15px'}}>Back to History</button></div>; }
        if (examLoadError && !['takingExam', 'examReview'].includes(studentView)) { return <div className="error-message-container widget-card"><FontAwesomeIcon icon={faExclamationTriangle} size="2x" style={{ color: 'var(--error-color)', marginBottom: '15px' }}/><h4>Error Starting Exam</h4><p style={{ color: 'var(--text-medium)' }}>{examLoadError}</p><button onClick={() => { setExamLoadError(null); handleMenuClick('exams'); }} className="widget-button secondary">Back to Exams List</button></div>; }
        if (studentView === 'exams' && isLoadingAvailableExams) { return <div className="loading-placeholder"><FontAwesomeIcon icon={faSpinner} spin size="2x" /><p>Loading available exams...</p></div>; }
        if (studentView === 'examHistory' && isLoadingHistory) { return <div className="loading-placeholder"><FontAwesomeIcon icon={faSpinner} spin /> Loading History...</div>; }
        if (isLoadingExam && studentView !== 'takingExam' && studentView !== 'examReview') { return <div className="loading-placeholder"><FontAwesomeIcon icon={faSpinner} spin size="2x" /><p>Loading exam...</p></div>; }
        if (isLoadingReview && studentView === 'examReview') { return <div className="loading-placeholder"><FontAwesomeIcon icon={faSpinner} spin /> Loading Review...</div>; }


        switch(studentView) {
            case 'examHistory': return <ExamHistoryPage role="student" historyData={examHistory} onViewDetails={handleViewExamReview} />;
            case 'examReview':
                if (reviewDataToShow) { return <StudentExamReviewPage onBack={handleBackFromReview} examReviewData={reviewDataToShow} />; }
                return <div className='error-message widget-card'>Review data not available.<button onClick={handleBackFromReview} className="widget-button secondary" style={{marginTop: '15px'}}>Back to History</button></div>;
            case 'takingExam':
                if (!examToTake) {
                    return <div className='error-message widget-card'>Error: Exam data could not be loaded to start.<button onClick={() => handleMenuClick('exams')} className="widget-button secondary" style={{marginTop: '15px'}}>Back to Exams</button></div>;
                }
                return <ExamTakingPage examData={examToTake} onFinishExam={handleFinishExam} user={user} />;
            case 'exams':
            default:
                return <StudentExamsPage examsData={availableExams} onStartExam={handleNavigateToTakeExam} user={user} />;
        }
    };

    return (
        <div className="dashboard-layout student-dashboard">
            <nav className="sidebar">
                <div className="sidebar-header"><FontAwesomeIcon icon={faUserGraduate} /> <h3>Student Panel</h3></div>
                <ul className="nav-menu">
                    <li className={`nav-item ${['exams', 'takingExam'].includes(studentView) ? 'active' : ''} ${(genelYuklemeDurumu || isTakingExam) ? 'disabled' : ''}`}
                        onClick={() => !(genelYuklemeDurumu || isTakingExam) && handleMenuClick('exams')}
                        title={(genelYuklemeDurumu || isTakingExam) ? "Unavailable during exam or loading" : "View Available Exams"}>
                        <FontAwesomeIcon icon={faFileAlt} className="nav-icon" /> <span className="nav-text">Exams</span>
                    </li>
                    <li className={`nav-item ${['examHistory', 'examReview'].includes(studentView) ? 'active' : ''} ${(genelYuklemeDurumu || isTakingExam) ? 'disabled' : ''}`}
                        onClick={() => !(genelYuklemeDurumu || isTakingExam) && handleMenuClick('examHistory')}
                        title={(genelYuklemeDurumu || isTakingExam) ? "Unavailable during exam or loading" : "View Exam History"}>
                        <FontAwesomeIcon icon={faHistory} className="nav-icon" /> <span className="nav-text">Exam History</span>
                    </li>
                </ul>
                <div className="sidebar-footer">
                    <button className="logout-button"
                            onClick={onLogout}
                            disabled={genelYuklemeDurumu || isTakingExam}
                            title={(genelYuklemeDurumu || isTakingExam) ? "Cannot logout during exam or loading" : "Logout"}>
                        <FontAwesomeIcon icon={faSignOutAlt} className="nav-icon" /> <span className="nav-text">Logout</span>
                    </button>
                </div>
            </nav>
            <main className="main-content">
                <header className="content-header">
                    <h1>
                        {studentView === 'exams' && (isLoadingAvailableExams ? 'Loading Exams...' : availableExamsError ? 'Error Loading Exams' : 'Available Exams')}
                        {studentView === 'examHistory' && (isLoadingHistory ? 'Loading History...' : historyLoadError ? 'Error Loading History' : 'Exam History')}
                        {studentView === 'examReview' && (isLoadingReview ? 'Loading Review...' : reviewLoadError ? 'Error Loading Review' : reviewDataToShow ? `Review: ${reviewDataToShow.quizTitle || 'Exam'}` : 'Review')}
                        {studentView === 'takingExam' && (isLoadingExam && !examToTake ? 'Starting Exam...' : examToTake ? `Taking Exam: ${examToTake?.title || ''}` : 'Error Starting Exam')}
                    </h1>
                    <ProfileDropdown
                        user={user}
                        onLogout={onLogout}
                        onChangePassword={onChangePassword}
                        onChangeEmail={onChangeEmail}
                        onChangeFullName={onChangeFullName}
                        disabled={isTakingExam || genelYuklemeDurumu}
                    />
                </header>
                <div className="content-body">{renderStudentContent()}</div>
            </main>
            <style jsx>{`
                .nav-item.disabled, .logout-button:disabled { cursor: not-allowed; opacity: 0.6; pointer-events: none; }
                .nav-item.disabled:hover { background-color: transparent !important; border-left-color: transparent !important; color: var(--text-medium) !important; }
                .nav-item.disabled:hover .nav-icon { color: var(--text-medium) !important; }
                .content-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-light); padding-bottom: 18px; margin-bottom: 35px; }
                .content-header h1 { margin: 0; }
            `}</style>
        </div>
    );
}

export default StudentDashboard;
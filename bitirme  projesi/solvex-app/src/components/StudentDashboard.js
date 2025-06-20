// src/components/StudentDashboard.js
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

// const TEMP_USER_ID = 1; // Use actual user ID

function StudentDashboard({ user, onLogout }) {
    const [studentView, setStudentView] = useState('exams');
    const [examToTake, setExamToTake] = useState(null);
    const [examHistory, setExamHistory] = useState([]);
    const [reviewDataToShow, setReviewDataToShow] = useState(null);
    const [selectedHistoryItemId, setSelectedHistoryItemId] = useState(null);
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

    const QUIZ_API_BASE_URL = 'http://localhost:8083/quiz';
    const userId = user?.id; // Get user ID from prop

    // --- Fetch Exam History ---
    useEffect(() => {
        if (studentView === 'examHistory' && userId) { // Ensure userId is available
            const fetchHistory = async () => {
                setIsLoadingHistory(true);
                setHistoryLoadError(null);
                console.log(`[StudentDashboard] Fetching exam history for User ID: ${userId}...`);
                try {
                    const response = await axios.get(`${QUIZ_API_BASE_URL}/history`, { params: { userId } });
                    console.log("[StudentDashboard] Received history data:", response.data);
                    if (Array.isArray(response.data)) {
                        const formattedHistory = response.data.map(item => ({
                            id: item.submissionId?.toString(),
                            examId: item.id,
                            submissionId: item.submissionId,
                            title: item.title ?? 'Untitled Exam',
                            dateTaken: item.dateTaken,
                            score: item.score,
                            studentStatus: item.studentStatus ?? 'COMPLETED', // Use studentStatus
                            durationMinutes: item.durationMinutes, // Ensure this matches DTO
                            totalPoints: item.totalPoints,
                            reviewAvailable: true
                        }));
                        formattedHistory.sort((a, b) => new Date(b.dateTaken).getTime() - new Date(a.dateTaken).getTime());
                        setExamHistory(formattedHistory);
                    } else {
                        throw new Error("Invalid history data format from server.");
                    }
                } catch (err) {
                    console.error(`[StudentDashboard] Error fetching history for User ID ${userId}:`, err);
                    let message = "Could not load exam history.";
                    if (err.response) { message = `Error ${err.response.status}: ${err.response.data?.message || 'Could not fetch history.'}`; }
                    else if (err.request) { message = "Cannot connect to server for history."; }
                    else { message = `Error: ${err.message}`; }
                    setHistoryLoadError(message);
                    setExamHistory([]);
                } finally {
                    setIsLoadingHistory(false);
                }
            };
            fetchHistory();
        }
    }, [studentView, refreshHistoryToggle, userId]); // Add userId as dependency

    // --- Fetch Available Exams ---
    useEffect(() => {
        if (studentView === 'exams' && userId) { // Ensure userId is available
            const fetchAvailable = async () => {
                setIsLoadingAvailableExams(true);
                setAvailableExamsError(null);
                setAvailableExams([]);
                console.log(`[StudentDashboard] Fetching available exams for User ID: ${userId}...`);
                try {
                    const response = await axios.get(`${QUIZ_API_BASE_URL}/available`, { params: { userId } });
                    console.log("[StudentDashboard] Received available exams data:", response.data);
                    if (Array.isArray(response.data)) {
                        // The backend now sends QuizInfoDto which should have the correct dynamic 'status'
                        setAvailableExams(response.data);
                    } else {
                        throw new Error("Invalid available exams data format received.");
                    }
                } catch (err) {
                    console.error(`[StudentDashboard] Error fetching available exams for User ID ${userId}:`, err);
                    let message = "Could not load available exams.";
                    if (err.response) { message = `Error ${err.response.status}: ${err.response.data?.message || 'Could not load exams.'}`; }
                    else if (err.request) { message = "Cannot connect to the server for exams."; }
                    else { message = `Error: ${err.message}`; }
                    setAvailableExamsError(message);
                } finally {
                    setIsLoadingAvailableExams(false);
                }
            };
            fetchAvailable();
        }
    }, [studentView, userId, refreshAvailableToggle]); // Add userId and refreshAvailableToggle as dependencies

    // --- Navigation ---
    const handleMenuClick = useCallback((viewName) => {
        if (isLoadingExam || isLoadingReview || isLoadingAvailableExams || isLoadingHistory) return;
        setStudentView(viewName);
        setExamToTake(null);
        setSelectedHistoryItemId(null);
        setReviewDataToShow(null);
        setExamLoadError(null);
        setHistoryLoadError(null);
        setReviewLoadError(null);
        setAvailableExamsError(null);
    }, [isLoadingExam, isLoadingReview, isLoadingAvailableExams, isLoadingHistory]);

    // --- Start Exam ---
    const handleNavigateToTakeExam = useCallback(async (quizId) => {
        // ... (no changes here, assumed correct) ...
        if (!quizId || isLoadingExam) return;
        setIsLoadingExam(true);
        setExamLoadError(null);
        setExamToTake(null);
        console.log(`[StudentDashboard] Attempting to start exam ID: ${quizId}`);
        try {
            const response = await axios.get(`${QUIZ_API_BASE_URL}/getQuestions/${quizId}`);
            console.log("[StudentDashboard] Received exam session data:", response.data);
            if (!response.data?.quizId || !Array.isArray(response.data.questions)) {
                throw new Error("Invalid exam data structure received from server.");
            }
            if (!response.data.durationMinutes || response.data.durationMinutes <= 0) {
                console.error(`Exam ID ${quizId} has invalid duration: ${response.data.durationMinutes}`);
                throw new Error(`Exam "${response.data.title || 'Unknown'}" has an invalid duration.`);
            }
            if (response.data.questions.length === 0) {
                console.error(`Exam ID ${quizId} has no questions.`);
                throw new Error(`Exam "${response.data.title || 'Unknown'}" contains no questions.`);
            }
            const firstInvalidQ = response.data.questions.find(q => q?.id == null || q?.type == null || q?.questiontitle == null || q?.points == null);
            if (firstInvalidQ) {
                console.error(`Incomplete question data received for exam ID ${quizId}. Missing fields in question:`, firstInvalidQ);
                throw new Error("Incomplete question data received (missing essential fields like ID, type, title, or points).");
            }
            setExamToTake(response.data);
            setStudentView('takingExam');
            console.log(`[StudentDashboard] Successfully loaded exam ID ${quizId}. Navigating to 'takingExam'.`);
        } catch (err) {
            console.error(`[StudentDashboard] Error fetching/validating exam ID ${quizId}:`, err);
            let message = err.message || "Could not load the exam details.";
            if (!err.message && err.response) {
                message = `Error ${err.response.status}: Could not load exam. ${err.response.data?.message || ''}`;
            } else if (!err.message && err.request) {
                message = "Cannot connect to the server to load the exam.";
            }
            setExamLoadError(message);
            setStudentView('exams');
        } finally {
            setIsLoadingExam(false);
        }
    }, [userId, isLoadingExam]); // Keep userId if needed for permission checks (though backend handles it)

    // --- View Review ---
    const handleViewExamReview = useCallback(async (submissionId) => {
        // ... (no changes here, assumed correct) ...
        console.log(`[StudentDashboard] handleViewExamReview called for Submission ID: ${submissionId}`);
        if (!userId) {
            alert("User ID not found. Cannot fetch review.");
            console.error("[StudentDashboard] User ID missing, cannot fetch review.");
            return;
        }
        if (!submissionId) {
            console.error("[StudentDashboard] handleViewExamReview called without submissionId!");
            return;
        }
        setIsLoadingReview(true);
        setReviewLoadError(null);
        setReviewDataToShow(null);
        setSelectedHistoryItemId(submissionId);
        const url = `${QUIZ_API_BASE_URL}/submission/${submissionId}/details`;
        console.log(`[StudentDashboard] Fetching review details from: ${url} for User ID: ${userId}`);
        try {
            const response = await axios.get(url, { params: { userId } });
            console.log("[StudentDashboard] Review data received from backend:", response.data);
            if (response.data && response.data.submissionId && Array.isArray(response.data.questions)) {
                setReviewDataToShow(response.data);
                setStudentView('examReview');
                console.log("[StudentDashboard] Set studentView to 'examReview'");
            } else {
                console.error("[StudentDashboard] Invalid review data structure received:", response.data);
                throw new Error("Invalid review data received from the server.");
            }
        } catch (err) {
            console.error(`[StudentDashboard] Error fetching review for Submission ID ${submissionId}:`, err);
            let message = "Could not load exam review details.";
            if (err.response) {
                if (err.response.status === 403) { message = "You do not have permission to view this review."; }
                else if (err.response.status === 404) { message = "Exam review not found."; }
                else { message = `Error ${err.response.status}: ${err.response.data?.message || 'Could not fetch review.'}`; }
            } else if (err.request) { message = "Cannot connect to the server to fetch the review."; }
            else { message = `Unexpected error: ${err.message}`; }
            setReviewLoadError(message);
            setStudentView('examHistory');
        } finally {
            setIsLoadingReview(false);
            console.log("[StudentDashboard] Finished handleViewExamReview.");
        }
    }, [userId]);

    // --- Back from Review ---
    const handleBackFromReview = useCallback(() => {
        // ... (no changes here, assumed correct) ...
        setSelectedHistoryItemId(null);
        setReviewDataToShow(null);
        setReviewLoadError(null);
        setStudentView('examHistory');
        setExamLoadError(null);
        setAvailableExamsError(null);
    }, []);

    // --- Finish Exam ---
    const handleFinishExam = useCallback(async (finishedQuizId, submittedAnswers) => {
        // ... (no changes here, assumed correct regarding submission payload) ...
        console.log(`[StudentDashboard] Processing finished exam ID: ${finishedQuizId} for User ID: ${userId}.`);
        if (isLoadingExam) {
            console.warn("[StudentDashboard] Submission already in progress.");
            return;
        }
        if (!examToTake || examToTake.quizId !== finishedQuizId) {
            console.error("[StudentDashboard] Mismatch between finishedQuizId and examToTake state.");
            setIsLoadingExam(false);
            alert("Error: Exam data mismatch. Please try again.");
            handleMenuClick('exams');
            return;
        }
        if (!submittedAnswers) {
            console.error("[StudentDashboard] Submitted answers are missing.");
            setIsLoadingExam(false);
            alert("Error: No answers were submitted.");
            handleMenuClick('exams');
            return;
        }
        setIsLoadingExam(true);
        setExamLoadError(null);
        const responsesPayload = Object.entries(submittedAnswers).map(([key, value]) => ({
            id: parseInt(key, 10),
            response: value
        }));
        console.log("[StudentDashboard] Sending payload to backend:", responsesPayload);
        try {
            const response = await axios.post(
                `${QUIZ_API_BASE_URL}/submit/${finishedQuizId}`,
                responsesPayload,
                { params: { userId } }
            );
            const submissionResult = response.data;
            console.log("[StudentDashboard] Backend submission successful. Result:", submissionResult);
            alert(`Exam submitted successfully! Your score: ${submissionResult?.achievedPoints ?? 'N/A'} / ${submissionResult?.totalPossiblePoints ?? 'N/A'}. Check your history.`);
            setExamToTake(null);
            setStudentView('examHistory');
            setRefreshHistoryToggle(prev => !prev);
            setRefreshAvailableToggle(prev => !prev); // Refresh available exams as well
        } catch (err) {
            console.error(`[StudentDashboard] Error submitting to backend quiz ${finishedQuizId} for User ID ${userId}:`, err);
            let message = "Failed to submit exam results to the server.";
            if (err.response) { message += ` (Server Error: ${err.response.status} - ${err.response.data?.message || err.response.data || ''})`; }
            else if (err.request) { message += " (Could not connect to server)."; }
            else { message += ` (${err.message})`; }
            alert(`Submission Error: ${message}`);
        } finally {
            setIsLoadingExam(false);
        }
    }, [examToTake, userId, isLoadingExam, handleMenuClick]);


    // --- Render Logic ---
    const renderStudentContent = () => {
        console.log(`[RenderLogic] View: ${studentView}, isLoadingAvailable: ${isLoadingAvailableExams}, isLoadingHistory: ${isLoadingHistory}, isLoadingExam: ${isLoadingExam}, isLoadingReview: ${isLoadingReview}`);

        if (studentView === 'exams' && availableExamsError) {
            return <div className="error-message-container widget-card"><FontAwesomeIcon icon={faExclamationTriangle} size="2x" style={{ color: 'var(--error-color)', marginBottom: '15px' }}/><h4>Error Loading Exams</h4><p style={{ color: 'var(--text-medium)' }}>{availableExamsError}</p><button onClick={() => { setAvailableExamsError(null); setRefreshAvailableToggle(p=>!p); }} className="widget-button secondary">Retry</button></div>;
        }
        if (studentView === 'examHistory' && historyLoadError) {
            return <div className="error-message-container widget-card">Error loading history: {historyLoadError}<button onClick={() => { setHistoryLoadError(null); setRefreshHistoryToggle(p=>!p); }} className="widget-button secondary">Retry</button></div>;
        }
        if (studentView === 'examReview' && reviewLoadError) {
            return <div className="error-message-container widget-card">Error loading review: {reviewLoadError}<button onClick={handleBackFromReview} className="widget-button secondary" style={{marginTop: '15px'}}>Back to History</button></div>;
        }
        if (examLoadError && !['takingExam', 'examReview'].includes(studentView)) {
            return <div className="error-message-container widget-card"><FontAwesomeIcon icon={faExclamationTriangle} size="2x" style={{ color: 'var(--error-color)', marginBottom: '15px' }}/><h4>Error Starting Exam</h4><p style={{ color: 'var(--text-medium)' }}>{examLoadError}</p><button onClick={() => { setExamLoadError(null); handleMenuClick('exams'); }} className="widget-button secondary">Back to Exams List</button></div>;
        }

        if (studentView === 'exams' && isLoadingAvailableExams) {
            return <div className="loading-placeholder"><FontAwesomeIcon icon={faSpinner} spin size="2x" /><p>Loading available exams...</p></div>;
        }
        if (studentView === 'examHistory' && isLoadingHistory) {
            return <div className="loading-placeholder"><FontAwesomeIcon icon={faSpinner} spin /> Loading History...</div>;
        }
        if (isLoadingExam && studentView !== 'takingExam' && studentView !== 'examReview') {
            return <div className="loading-placeholder"><FontAwesomeIcon icon={faSpinner} spin size="2x" /><p>Loading exam...</p></div>;
        }
        if (isLoadingReview && studentView === 'examReview') {
            return <div className="loading-placeholder"><FontAwesomeIcon icon={faSpinner} spin /> Loading Review...</div>;
        }

        switch(studentView) {
            case 'examHistory':
                return <ExamHistoryPage role="student" historyData={examHistory} onViewDetails={handleViewExamReview} />;
            case 'examReview':
                if (reviewDataToShow) {
                    return <StudentExamReviewPage onBack={handleBackFromReview} examReviewData={reviewDataToShow} />;
                }
                return <div className='error-message widget-card'>Review data not available.<button onClick={handleBackFromReview} className="widget-button secondary" style={{marginTop: '15px'}}>Back to History</button></div>;
            case 'takingExam':
                if (!examToTake) {
                    return <div className='error-message widget-card'>Error: Exam data could not be loaded to start.<button onClick={() => handleMenuClick('exams')} className="widget-button secondary" style={{marginTop: '15px'}}>Back to Exams</button></div>;
                }
                return <ExamTakingPage examData={examToTake} onFinishExam={handleFinishExam} />;
            case 'exams':
            default:
                return <StudentExamsPage examsData={availableExams} onStartExam={handleNavigateToTakeExam} />;
        }
    };

    // --- Main JSX ---
    return (
        <div className="dashboard-layout student-dashboard">
            <nav className="sidebar">
                <div className="sidebar-header"><FontAwesomeIcon icon={faUserGraduate} /> <h3>Student Panel</h3></div>
                <ul className="nav-menu">
                    <li className={`nav-item ${['exams', 'takingExam'].includes(studentView) ? 'active' : ''} ${isLoadingAvailableExams || isLoadingExam || isLoadingHistory || isLoadingReview ? 'disabled' : ''}`}
                        onClick={() => handleMenuClick('exams')}
                        title={isLoadingAvailableExams || isLoadingExam || isLoadingHistory || isLoadingReview ? "Loading..." : "View Available Exams"}>
                        <FontAwesomeIcon icon={faFileAlt} className="nav-icon" /> <span className="nav-text">Exams</span>
                    </li>
                    <li className={`nav-item ${['examHistory', 'examReview'].includes(studentView) ? 'active' : ''} ${isLoadingAvailableExams || isLoadingExam || isLoadingHistory || isLoadingReview ? 'disabled' : ''}`}
                        onClick={() => handleMenuClick('examHistory')}
                        title={isLoadingAvailableExams || isLoadingExam || isLoadingHistory || isLoadingReview ? "Loading..." : "View Exam History"}>
                        <FontAwesomeIcon icon={faHistory} className="nav-icon" /> <span className="nav-text">Exam History</span>
                    </li>
                </ul>
                <div className="sidebar-footer">
                    <button className="logout-button" onClick={onLogout} disabled={isLoadingExam || isLoadingHistory || isLoadingReview || isLoadingAvailableExams}
                            title={isLoadingExam || isLoadingHistory || isLoadingReview || isLoadingAvailableExams ? "Cannot logout while loading/submitting" : "Logout"}>
                        <FontAwesomeIcon icon={faSignOutAlt} className="nav-icon" /> <span className="nav-text">Logout</span>
                    </button>
                </div>
            </nav>
            <main className="main-content">
                <header className="content-header"><h1>
                    {studentView === 'exams' && (isLoadingAvailableExams ? 'Loading Exams...' : availableExamsError ? 'Error Loading Exams' : 'Available Exams')}
                    {studentView === 'examHistory' && (isLoadingHistory ? 'Loading History...' : historyLoadError ? 'Error Loading History' : 'Exam History')}
                    {studentView === 'examReview' && (isLoadingReview ? 'Loading Review...' : reviewLoadError ? 'Error Loading Review' : reviewDataToShow ? `Review: ${reviewDataToShow.quizTitle || 'Exam'}` : 'Review')}
                    {studentView === 'takingExam' && (isLoadingExam && !examToTake ? 'Starting Exam...' : examToTake ? `Taking Exam: ${examToTake?.title || ''}` : 'Error Starting Exam')}
                </h1></header>
                <div className="content-body">{renderStudentContent()}</div>
            </main>
            <style jsx>{` .nav-item.disabled, .logout-button:disabled { cursor: not-allowed; opacity: 0.6; } `}</style>
        </div>
    );
}

export default StudentDashboard;
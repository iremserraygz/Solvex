import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import '../App.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faListAlt, faHistory, faDatabase, faPlusSquare, faSignOutAlt,
    faChalkboardTeacher, faEdit, faClipboardList, faChartBar,
    faPencilAlt, faBookOpen, faSpinner, faExclamationTriangle,
    faInfoCircle // <<--- BU SATIR EKLENDİ VE DOĞRULANDI ---<<
} from '@fortawesome/free-solid-svg-icons';

import CreateExamPage from './CreateExamPage';
import CreateQuestionPage from './CreateQuestionPage';
import QuestionPoolPage from './QuestionPoolPage';
// import ExamHistoryPage from './ExamHistoryPage';
import ViewExamsPage from './ViewExamsPage';
import InstructorExamResultsPage from './InstructorExamResultsPage';

const QUESTION_SERVICE_URL = 'http://localhost:8081/question';
const QUIZ_SERVICE_URL = 'http://localhost:8083/quiz';

const determineDynamicStatusForView = (quiz) => {
    const now = new Date();
    const startDate = quiz.startDate ? new Date(quiz.startDate) : null;
    const endDate = quiz.endDate ? new Date(quiz.endDate) : null;
    const originalStatus = quiz.status?.toUpperCase();

    if (originalStatus === 'ENDED') return 'ENDED';
    if (endDate && now > endDate) return 'ENDED';
    if (!startDate && (originalStatus === 'PUBLISHED' || originalStatus === 'ACTIVE')) return 'ACTIVE';
    if (startDate && now >= startDate) {
        if (originalStatus === 'PUBLISHED' || originalStatus === 'ACTIVE') return 'ACTIVE';
    } else if (startDate && now < startDate) {
        if (originalStatus === 'PUBLISHED' || originalStatus === 'ACTIVE') return 'PUBLISHED';
    }
    return quiz.status;
};

function InstructorDashboard({ user, onLogout }) {
    const [instructorView, setInstructorView] = useState('dashboardOverview');
    const [allQuestions, setAllQuestions] = useState([]);
    const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
    const [questionLoadError, setQuestionLoadError] = useState(null);
    const [questionToEdit, setQuestionToEdit] = useState(null);

    const [currentExamQuestions, setCurrentExamQuestions] = useState([]);
    const [currentExamDetails, setCurrentExamDetails] = useState({
        title: '', description: '', durationMinutes: 60, startDate: '', endDate: '', passingScore: 50, questionIds: []
    });
    const [isEditingExam, setIsEditingExam] = useState(false);
    const [examToEditId, setExamToEditId] = useState(null);

    const [savedExams, setSavedExams] = useState([]);
    const [isLoadingExams, setIsLoadingExams] = useState(false);
    const [examsError, setExamsError] = useState(null);

    const [isSubmittingExam, setIsSubmittingExam] = useState(false);
    const [detailedExamResults, setDetailedExamResults] = useState(null);
    const [selectedExamIdForResults, setSelectedExamIdForResults] = useState(null);
    const [isLoadingResults, setIsLoadingResults] = useState(false);

    const fetchAllQuestions = useCallback(async () => {
        setIsLoadingQuestions(true);
        setQuestionLoadError(null);
        try {
            const response = await axios.get(`${QUESTION_SERVICE_URL}/allQuestions`);
            if (Array.isArray(response.data)) {
                const formattedQuestions = response.data.map(q => ({
                    id: q.id.toString(), text: q.questiontitle, type: q.type, category: q.category, points: q.points, difficultylevel: q.difficultylevel,
                    ...(q.type === 'MCQ' && { options: [q.option1, q.option2, q.option3, q.option4].filter(opt => opt != null),
                        answer: (() => { const opts = [q.option1, q.option2, q.option3, q.option4]; const idx = opts.findIndex(opt => opt && opt.trim() === q.rightanswer?.trim()); return idx !== -1 ? String.fromCharCode(65 + idx) : ''; })() }),
                    ...(q.type === 'TF' && { answer: q.rightanswer }), ...(q.type === 'Short Answer' && { answer: q.rightanswer }),
                    lastModified: q.lastModified || new Date().toISOString(), title: q.title
                }));
                setAllQuestions(formattedQuestions);
            } else { throw new Error("Invalid data format for questions."); }
        } catch (error) {
            let message = "Could not load questions.";
            if (error.response) { message = `Error ${error.response.status}: ${error.response.data?.message || 'Failed to fetch questions.'}`; }
            else if (error.request) { message = "Cannot connect to question service."; }
            else { message = `Unexpected error: ${error.message}`; }
            setQuestionLoadError(message); setAllQuestions([]);
        } finally { setIsLoadingQuestions(false); }
    }, []);

    useEffect(() => { fetchAllQuestions(); }, [fetchAllQuestions]);

    const fetchSavedExams = useCallback(async () => {
        setIsLoadingExams(true);
        setExamsError(null);
        try {
            const response = await axios.get(`${QUIZ_SERVICE_URL}/instructor/all`);
            if (Array.isArray(response.data)) {
                const formattedExams = response.data.map(exam => ({
                    ...exam,
                    id: exam.id.toString(),
                    status: determineDynamicStatusForView(exam),
                    questions: exam.questionIds ? exam.questionIds.length : 0,
                    duration: exam.durationMinutes
                }));
                setSavedExams(formattedExams);
            } else { throw new Error("Invalid data format for saved exams."); }
        } catch (error) {
            let message = "Could not load your exams.";
            if (error.response) { message = `Error ${error.response.status}: ${error.response.data?.message || 'Failed to fetch exams.'}`; }
            else if (error.request) { message = "Cannot connect to exam service."; }
            else { message = `Unexpected error: ${error.message}`; }
            setExamsError(message); setSavedExams([]);
        } finally { setIsLoadingExams(false); }
    }, []);

    useEffect(() => {
        if (instructorView === 'viewExams' || instructorView === 'dashboardOverview') {
            fetchSavedExams();
        }
    }, [instructorView, fetchSavedExams]);

    const handleMenuClick = (viewName) => {
        setIsEditingExam(false);
        setDetailedExamResults(null);
        setSelectedExamIdForResults(null);
        setIsLoadingResults(false);
        if (!['createExam', 'createOrEditQuestion', 'addToExamPool', 'examResults'].includes(viewName)) {
            setQuestionToEdit(null);
            setCurrentExamDetails({ title: '', description: '', durationMinutes: 60, startDate: '', endDate: '', passingScore: 50, questionIds: [] });
            setCurrentExamQuestions([]);
            setExamToEditId(null);
        }
        setInstructorView(viewName);
        if (viewName === 'viewExams' && (savedExams.length === 0 || examsError)) { fetchSavedExams(); }
        if ((viewName === 'questionPool' || viewName === 'addToExamPool') && allQuestions.length === 0 && !isLoadingQuestions) { fetchAllQuestions(); }
    };

    const navigateToCreateQuestion = () => { setQuestionToEdit(null); setInstructorView('createOrEditQuestion'); };
    const handleNavigateToEditQuestion = (questionId) => { const q = allQuestions.find(q => q.id === questionId); if (q) { setQuestionToEdit(q); setInstructorView('createOrEditQuestion'); } else { alert("Question not found."); fetchAllQuestions();} };
    const navigateToAddToExamPool = () => {
        if (allQuestions.length === 0 && !isLoadingQuestions) { fetchAllQuestions(); }
        setInstructorView('addToExamPool');
    };
    const handleBackFromQuestionCreate = (isEditingQuestion) => {
        if (currentExamDetails && (currentExamDetails.id || currentExamDetails.title || currentExamQuestions.length > 0 || isEditingExam)) {
            setInstructorView('createExam');
        } else {
            setInstructorView('questionPool');
        }
        setQuestionToEdit(null);
    };

    const handleSaveNewQuestion = async (newQuestionPayload) => {
        try {
            const response = await axios.post(`${QUESTION_SERVICE_URL}/add`, newQuestionPayload);
            if (response.status === 201 && response.data?.id != null) {
                const savedQuestion = response.data;
                const formattedSavedQuestion = {
                    id: savedQuestion.id.toString(), text: savedQuestion.questiontitle, type: savedQuestion.type, category: savedQuestion.category, points: savedQuestion.points, difficultylevel: savedQuestion.difficultylevel,
                    ...(savedQuestion.type === 'MCQ' && { options: [savedQuestion.option1, savedQuestion.option2, savedQuestion.option3, savedQuestion.option4].filter(opt => opt != null), answer: (()=>{const os=[savedQuestion.option1,savedQuestion.option2,savedQuestion.option3,savedQuestion.option4]; const ci=os.findIndex(o=>o&&o.trim()===savedQuestion.rightanswer?.trim()); return ci!==-1?String.fromCharCode(65+ci):''})() }),
                    ...(savedQuestion.type==='TF'&&{answer:savedQuestion.rightanswer}),...(savedQuestion.type==='Short Answer'&&{answer:savedQuestion.rightanswer}),
                    lastModified: savedQuestion.lastModified || new Date().toISOString(), title: savedQuestion.title
                };
                setAllQuestions(prevQuestions => [...prevQuestions, formattedSavedQuestion]);
                alert(`Question added successfully!`);
                handleBackFromQuestionCreate(false);
            } else { throw new Error("Backend save successful but returned invalid data"); }
        } catch (error) {
            console.error("Error saving new question:", error);
            let errorMsg = "Failed to save question.";
            if (error.response) { errorMsg = `Could not save: ${error.response.data?.message || 'Invalid data.'}`; }
            else if (error.request) { errorMsg = "Cannot connect to server."; }
            alert(`Error: ${errorMsg}`);
        }
    };

    const handleUpdateQuestion = async (updatedQuestionPayload) => {
         try {
            const response = await axios.put(`${QUESTION_SERVICE_URL}/update/${updatedQuestionPayload.id}`, updatedQuestionPayload);
            if (response.status === 200 && response.data?.id != null) {
                const updatedQuestionFromBackend = response.data;
                const formattedUpdatedQuestion = {
                    id: updatedQuestionFromBackend.id.toString(), text: updatedQuestionFromBackend.questiontitle, type: updatedQuestionFromBackend.type, category: updatedQuestionFromBackend.category, points: updatedQuestionFromBackend.points, difficultylevel: updatedQuestionFromBackend.difficultylevel,
                    ...(updatedQuestionFromBackend.type === 'MCQ' && { options: [updatedQuestionFromBackend.option1, updatedQuestionFromBackend.option2, updatedQuestionFromBackend.option3, updatedQuestionFromBackend.option4].filter(opt => opt != null), answer: (()=>{const os=[updatedQuestionFromBackend.option1,updatedQuestionFromBackend.option2,updatedQuestionFromBackend.option3,updatedQuestionFromBackend.option4]; const ci=os.findIndex(o=>o&&o.trim()===updatedQuestionFromBackend.rightanswer?.trim()); return ci!==-1?String.fromCharCode(65+ci):''})() }),
                    ...(updatedQuestionFromBackend.type==='TF'&&{answer:updatedQuestionFromBackend.rightanswer}),...(updatedQuestionFromBackend.type==='Short Answer'&&{answer:updatedQuestionFromBackend.rightanswer}),
                    lastModified: updatedQuestionFromBackend.lastModified || new Date().toISOString(), title: updatedQuestionFromBackend.title
                 };
                setAllQuestions(prev => prev.map(q => (q.id === formattedUpdatedQuestion.id ? formattedUpdatedQuestion : q)));
                setCurrentExamQuestions(prev => prev.map(q => (q.id === formattedUpdatedQuestion.id ? formattedUpdatedQuestion : q)));
                alert(`Question ID ${formattedUpdatedQuestion.id} updated successfully!`);
                handleBackFromQuestionCreate(true);
            } else { throw new Error("Backend update successful but returned invalid data"); }
        } catch (error) {
            console.error(`Error updating question ID ${updatedQuestionPayload.id}:`, error);
            let errorMsg = "Failed to update question.";
            if (error.response) {
                if (error.response.status === 404) { errorMsg = "Question not found on server."; }
                else if (error.response.status === 400) { errorMsg = `Could not update: ${error.response.data?.message || 'Invalid data.'}`; }
                else { errorMsg = `Server Error: ${error.response.status}`; }
            } else if (error.request) { errorMsg = "Cannot connect to server."; }
            alert(`Error: ${errorMsg}`);
        }
    };

    const handleDeleteQuestionFromPool = async (id) => { /* ... Önceki tam kod ... */ };
    const handleRemoveQuestionFromExam = (id) => setCurrentExamQuestions(prev => prev.filter(q => q.id !== id));
    const handleAddQuestionsFromPool = useCallback((selectedQuestionIds) => {
        const questionsToAdd = allQuestions.filter(q => selectedQuestionIds.has(q.id));
        setCurrentExamQuestions(prevExamQuestions => {
            const currentIds = new Set(prevExamQuestions.map(q => q.id));
            const newQuestions = questionsToAdd.filter(q => !currentIds.has(q.id));
            return [...prevExamQuestions, ...newQuestions];
        });
        setInstructorView('createExam');
    }, [allQuestions]);
    const handleCancelAddFromPool = useCallback(() => { setInstructorView('createExam'); }, []);
    const handlePublishOrCreateExam = async (examData) => {
        if (isSubmittingExam) return;
        setIsSubmittingExam(true);
        const apiType = isEditingExam && currentExamDetails?.id ? 'Updating' : 'Publishing';
        const payload = { ...examData, questionIds: examData.questionIds.map(id => parseInt(id, 10)) };
        try {
            let response;
            if (isEditingExam && currentExamDetails?.id) {
                response = await axios.put(`${QUIZ_SERVICE_URL}/update/${currentExamDetails.id}`, payload);
            } else {
                response = await axios.post(`${QUIZ_SERVICE_URL}/save`, payload);
            }
            if ((response.status === 200 || response.status === 201) && response.data) {
                alert(`Exam "${response.data.title}" ${isEditingExam ? 'updated' : 'published'} successfully!`);
                setCurrentExamDetails({ title: '', description: '', durationMinutes: 60, startDate: '', endDate: '', passingScore: 50, questionIds: [] });
                setCurrentExamQuestions([]);
                setIsEditingExam(false);
                setExamToEditId(null);
                fetchSavedExams();
                handleMenuClick('viewExams');
            } else { throw new Error(`Unexpected response: ${response.status}`); }
        } catch (error) {
            let msg = `Failed to ${isEditingExam ? 'update' : 'publish'} exam.`;
            if (error.response) { msg = `Error ${error.response.status}: ${error.response.data?.message || error.response.data || 'Server error'}`; }
            else if (error.request) { msg = "Cannot connect to server."; }
            alert(`Error: ${msg}`);
        } finally { setIsSubmittingExam(false); }
    };
    const handleSaveExam = (data, status) => { console.log(`Saving exam as ${status}`, data); alert(`Exam "${data.title}" saved as ${status} (locally for now).`);};
    const handleNavigateToEditExam = async (examId) => {
        setIsLoadingExams(true);
        try {
            const response = await axios.get(`${QUIZ_SERVICE_URL}/details/${examId}`);
            if (response.data) {
                const examApi = response.data;
                let questionsForExam = [];
                if (examApi.questionIds && examApi.questionIds.length > 0) {
                    let sourceQuestions = allQuestions;
                    if (sourceQuestions.length === 0) {
                        const questionsResponse = await axios.post(`${QUESTION_SERVICE_URL}/getQuestions`, examApi.questionIds);
                        if(questionsResponse.data) {
                             sourceQuestions = questionsResponse.data.map(q => ({
                                id: q.id.toString(), text: q.questiontitle, type: q.type, category: q.category, points: q.points, difficultylevel: q.difficultylevel,
                                ...(q.type === 'MCQ' && { options: [q.option1, q.option2, q.option3, q.option4].filter(opt => opt != null), answer: (()=>{const os=[q.option1,q.option2,q.option3,q.option4]; const ci=os.findIndex(o=>o&&o.trim()===q.rightanswer?.trim()); return ci!==-1?String.fromCharCode(65+ci):''})() }),
                                ...(q.type==='TF'&&{answer:q.rightanswer}),...(q.type==='Short Answer'&&{answer:q.rightanswer}),
                                lastModified: q.lastModified || new Date().toISOString(), title: q.title
                            }));
                        }
                    }
                    questionsForExam = sourceQuestions.filter(q =>
                        examApi.questionIds.includes(parseInt(q.id, 10))
                    );
                }
                setCurrentExamDetails({
                    id: examApi.id.toString(), title: examApi.title, description: examApi.description,
                    durationMinutes: examApi.durationMinutes, startDate: examApi.startDate,
                    endDate: examApi.endDate, passingScore: examApi.passingScore,
                    questionIds: examApi.questionIds || [], status: examApi.status
                });
                setCurrentExamQuestions(questionsForExam);
                setIsEditingExam(true);
                setExamToEditId(examId);
                setInstructorView('createExam');
            } else { throw new Error("Exam details not found."); }
        } catch (error) { console.error("Error fetching exam details for edit:", error); alert("Could not load exam details for editing."); setExamsError("Failed to load exam for editing."); }
        finally { setIsLoadingExams(false); }
    };
    const navigateToCreateExam = () => {
        setCurrentExamDetails({ title: '', description: '', durationMinutes: 60, startDate: '', endDate: '', passingScore: 50, questionIds: [] });
        setCurrentExamQuestions([]);
        setIsEditingExam(false);
        setExamToEditId(null);
        setInstructorView('createExam');
    };
    const handleDeleteExam = async (examId) => {
        const exam = savedExams.find(e => e.id === examId);
        if (!exam) { alert("Exam not found."); return; }
        if (window.confirm(`Delete exam "${exam.title}"? This cannot be undone.`)) {
            setIsLoadingExams(true);
            try {
                await axios.delete(`${QUIZ_SERVICE_URL}/delete/${examId}`);
                alert(`Exam "${exam.title}" deleted.`);
                fetchSavedExams();
            } catch (error) {
                let msg = "Failed to delete exam.";
                if (error.response) { msg = error.response.status === 404 ? "Exam not on server." : `Server Error: ${error.response.status} - ${error.response.data?.message || ''}`; }
                else if (error.request) { msg = "Cannot connect to server."; }
                alert(`Error: ${msg}`);
            } finally { setIsLoadingExams(false); }
        }
    };
    const handleViewExamResults = async (examId) => {
        console.log("[InstructorDashboard] Viewing results for exam ID:", examId);
        if (!examId) { alert("Invalid Exam ID for viewing results."); return; }
        setIsLoadingResults(true);
        setDetailedExamResults(null);
        setSelectedExamIdForResults(examId);
        try {
            const response = await axios.get(`${QUIZ_SERVICE_URL}/${examId}/results`);
            console.log("[InstructorDashboard] Results data from backend:", response.data);
            if (response.data && typeof response.data === 'object') {
                setDetailedExamResults(response.data);
                setInstructorView('examResults');
            } else {
                console.error("Invalid or empty results data received for exam ID " + examId + ":", response.data);
                throw new Error("No valid results data received from backend.");
            }
        } catch (error) {
            console.error("[InstructorDashboard] Error fetching exam results for ID " + examId + ":", error);
            let errorMsg = "Could not load exam results.";
            if (error.response) { errorMsg = `Error ${error.response.status}: ${error.response.data?.message || 'Failed to fetch results.'}`; }
            else if (error.request) { errorMsg = "Cannot connect to the server to get results."; }
            else { errorMsg = `Unexpected error: ${error.message}`; }
            alert(errorMsg);
            setDetailedExamResults(null);
            setSelectedExamIdForResults(null);
        } finally { setIsLoadingResults(false); }
    };

    const currentQuestionIds = useMemo(() => new Set(currentExamQuestions.map(q => q.id)), [currentExamQuestions]);

    const renderContent = () => {
        if (isLoadingExams && instructorView === 'viewExams' && savedExams.length === 0) { return <div className="loading-placeholder"><FontAwesomeIcon icon={faSpinner} spin size="2x" /><p>Loading exams...</p></div>; }
        if (examsError && instructorView === 'viewExams') { return <div className="error-message-container widget-card"><FontAwesomeIcon icon={faExclamationTriangle} size="2x" /><p>{examsError}</p><button onClick={fetchSavedExams} className="widget-button secondary">Retry</button></div>; }
        if (isLoadingResults && instructorView === 'examResults' && !detailedExamResults) { return <div className="loading-placeholder"><FontAwesomeIcon icon={faSpinner} spin size="2x" /><p>Loading exam results...</p></div>; }
        if (isSubmittingExam && instructorView === 'createExam') { return <div className="loading-placeholder"><FontAwesomeIcon icon={faSpinner} spin size="2x" /><p>Submitting exam...</p></div>; }
        if (isLoadingQuestions && (instructorView === 'questionPool' || instructorView === 'addToExamPool') && allQuestions.length === 0) { return <div className="loading-placeholder"><FontAwesomeIcon icon={faSpinner} spin size="2x" /><p>Loading questions...</p></div>; }
        if (questionLoadError && (instructorView === 'questionPool' || instructorView === 'addToExamPool')) { return <div className="error-message-container widget-card"><FontAwesomeIcon icon={faExclamationTriangle} size="2x" /><p>{questionLoadError}</p><button onClick={fetchAllQuestions} className="widget-button secondary">Retry</button></div>; }

        switch(instructorView) {
            case 'createExam':
                 return <CreateExamPage
                     key={currentExamDetails?.id || examToEditId || 'new-exam'}
                     initialDetails={currentExamDetails}
                     initialQuestions={currentExamQuestions}
                     isEditing={isEditingExam}
                     onRemoveQuestion={handleRemoveQuestionFromExam}
                     onNavigateToCreateQuestion={navigateToCreateQuestion}
                     onNavigateToAddToExamPool={navigateToAddToExamPool}
                     onSaveDraft={(examData) => handleSaveExam(examData, 'Draft')}
                     onPublish={handlePublishOrCreateExam}
                 />;
            case 'createOrEditQuestion': return <CreateQuestionPage key={questionToEdit ? questionToEdit.id : 'new'} initialQuestionData={questionToEdit} onSave={handleSaveNewQuestion} onUpdate={handleUpdateQuestion} onBack={() => handleBackFromQuestionCreate(!!questionToEdit)} />;
            case 'viewExams':
                 return <ViewExamsPage examsData={savedExams} isLoading={isLoadingExams && savedExams.length === 0} error={examsError} onRetryFetch={fetchSavedExams} onEditExam={handleNavigateToEditExam} onDeleteExam={handleDeleteExam} onViewResults={handleViewExamResults} onNavigateToCreate={navigateToCreateExam} />;
            case 'questionPool': return <QuestionPoolPage mode="poolManagement" questions={allQuestions} isLoading={isLoadingQuestions && allQuestions.length === 0} error={questionLoadError} onRetryFetch={fetchAllQuestions} onNavigateToCreate={navigateToCreateQuestion} onEditQuestion={handleNavigateToEditQuestion} onDeleteQuestion={handleDeleteQuestionFromPool} existingQuestionIdsInExam={new Set()} />;
            case 'addToExamPool': return <QuestionPoolPage mode="addToExam" questions={allQuestions} isLoading={isLoadingQuestions && allQuestions.length === 0} error={questionLoadError} onRetryFetch={fetchAllQuestions} onAddSelectedToExam={handleAddQuestionsFromPool} onCancel={handleCancelAddFromPool} existingQuestionIdsInExam={currentQuestionIds} />;
            case 'examResults':
                if (isLoadingResults) {
                    return <div className="loading-placeholder"><FontAwesomeIcon icon={faSpinner} spin size="2x" /><p>Loading results...</p></div>;
                }
                if (!detailedExamResults) {
                    return (
                        <div className="error-message-container widget-card">
                            <FontAwesomeIcon icon={faInfoCircle} size="2x" style={{color: 'var(--text-medium)', marginBottom: '15px'}}/>
                            <h4>Results Not Available</h4>
                            <p>Could not load results for the selected exam (ID: {selectedExamIdForResults || 'N/A'}). This exam might not have any submissions yet or an error occurred.</p>
                            <button onClick={() => handleMenuClick('viewExams')} className="widget-button secondary">Back to Manage Exams</button>
                        </div>
                    );
                }
                return <InstructorExamResultsPage
                           examResults={detailedExamResults}
                           onBackToExams={() => handleMenuClick('viewExams')}
                       />;
            case 'dashboardOverview':
            default:
                 return (
                     <div className="widgets-container">
                         <div className="widget-card accent-border-left animated-fade-in-up" onClick={navigateToCreateExam} style={{cursor:'pointer', animationDelay: '0.1s'}}> <FontAwesomeIcon icon={faPlusSquare} className="widget-icon accent-color" /> <div className="widget-content"> <h4>Create New Exam</h4> <p>Design and publish a new exam.</p> <button className="widget-button primary">Start Creating</button> </div> </div>
                         <div className="widget-card accent-border-left animated-fade-in-up" onClick={() => handleMenuClick('questionPool')} style={{cursor:'pointer', animationDelay: '0.2s'}}> <FontAwesomeIcon icon={faDatabase} className="widget-icon accent-color" /> <div className="widget-content"> <h4>Question Pool</h4> <p>Manage questions ({isLoadingQuestions && !allQuestions.length ? 'loading...' : allQuestions.length}).</p> <button className="widget-button secondary">Manage Pool</button> </div> </div>
                         <div className="widget-card accent-border-left animated-fade-in-up" onClick={() => handleMenuClick('viewExams')} style={{cursor:'pointer', animationDelay: '0.3s'}}> <FontAwesomeIcon icon={faClipboardList} className="widget-icon accent-color" /> <div className="widget-content"> <h4>View & Manage Exams</h4> <p>Review, edit, or see results ({isLoadingExams && !savedExams.length ? 'loading...' : savedExams.length} exams).</p> <button className="widget-button secondary">Manage Exams</button> </div> </div>
                     </div>
                 );
        }
    };

    return (
        <div className="dashboard-layout instructor-dashboard">
            <nav className="sidebar">
                <div className="sidebar-header"> <FontAwesomeIcon icon={faChalkboardTeacher} /> <h3>Instructor Panel</h3> </div>
                <ul className="nav-menu">
                    <li className={`nav-item ${instructorView === 'dashboardOverview' ? 'active' : ''}`} onClick={() => handleMenuClick('dashboardOverview')}> <FontAwesomeIcon icon={faChalkboardTeacher} className="nav-icon" /> <span className="nav-text">Dashboard</span> </li>
                    <li className={`nav-item ${instructorView === 'viewExams' || instructorView === 'examResults' || (instructorView === 'createExam' && isEditingExam) ? 'active' : ''}`} onClick={() => handleMenuClick('viewExams')}> <FontAwesomeIcon icon={faListAlt} className="nav-icon" /> <span className="nav-text">Manage Exams</span> </li>
                    <li className={`nav-item ${(instructorView === 'questionPool' || (instructorView === 'createOrEditQuestion' && !currentExamDetails?.id && !isEditingExam && questionToEdit) || instructorView === 'addToExamPool') ? 'active' : ''}`} onClick={() => handleMenuClick('questionPool')}> <FontAwesomeIcon icon={faDatabase} className="nav-icon" /> <span className="nav-text">Question Pool</span> </li>
                    <li className={`nav-item ${(instructorView === 'createExam' && !isEditingExam || (instructorView === 'createOrEditQuestion' && currentExamDetails?.id && !questionToEdit && !isEditingExam) ) ? 'active' : ''}`} onClick={navigateToCreateExam}>
                        <FontAwesomeIcon icon={faPlusSquare} className="nav-icon" />
                        <span className="nav-text">Create Exam</span>
                    </li>
                </ul>
                <div className="sidebar-footer"> <button className="logout-button" onClick={onLogout}> <FontAwesomeIcon icon={faSignOutAlt} className="nav-icon" /> <span className="nav-text">Logout</span> </button> </div>
            </nav>
            <main className="main-content">
                <header className="content-header"><h1>
                    {instructorView === 'dashboardOverview' && 'Dashboard Overview'}
                    {instructorView === 'createExam' && (isEditingExam && currentExamDetails?.title ? `Edit Exam: ${currentExamDetails.title}` : 'Create New Exam')}
                    {instructorView === 'createOrEditQuestion' && (questionToEdit ? `Edit Question ID: ${questionToEdit.id}` : 'Create New Question')}
                    {instructorView === 'viewExams' && 'View & Manage Exams'}
                    {instructorView === 'questionPool' && 'Question Pool'}
                    {instructorView === 'addToExamPool' && `Add Questions to: ${currentExamDetails?.title || 'New Exam'}`}
                    {instructorView === 'examResults' && (detailedExamResults?.quizTitle ? `Results: ${detailedExamResults.quizTitle}`: 'Exam Results')}
                </h1></header>
                <div className="content-body">
                    {renderContent()}
                    {/* Modal gösterimi artık renderContent içinde 'examResults' case'i ile yönetiliyor */}
                </div>
            </main>
        </div>
    );
}
export default InstructorDashboard;
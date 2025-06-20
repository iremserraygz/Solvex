import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import '../App.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faListAlt, faDatabase, faPlusSquare, faSignOutAlt,
    faChalkboardTeacher, faSpinner, faExclamationTriangle,
    faInfoCircle, faEye, faTimes
} from '@fortawesome/free-solid-svg-icons';

import CreateExamPage from './CreateExamPage';
import CreateQuestionPage from './CreateQuestionPage';
import QuestionPoolPage from './QuestionPoolPage';
import ViewExamsPage from './ViewExamsPage';
import InstructorExamResultsPage from './InstructorExamResultsPage';
import InstructorStudentReviewPage from './InstructorStudentReviewPage';
import ProfileDropdown from './ProfileDropdown';
const QUESTION_SERVICE_URL = process.env.REACT_APP_QUESTION_SERVICE_URL;
const QUIZ_SERVICE_URL = process.env.REACT_APP_QUIZ_SERVICE_URL;
console.log("[InstructorDashboard] REACT_APP_QUESTION_SERVICE_URL:", process.env.REACT_APP_QUESTION_SERVICE_URL);
console.log("[InstructorDashboard] REACT_APP_QUIZ_SERVICE_URL:", process.env.REACT_APP_QUIZ_SERVICE_URL);
console.log("[InstructorDashboard] Effective QUESTION_SERVICE_URL:", QUESTION_SERVICE_URL);
console.log("[InstructorDashboard] Effective QUIZ_SERVICE_URL:", QUIZ_SERVICE_URL);

const determineDynamicStatusForView = (quiz) => {
    const now = new Date();
    const startDate = quiz.startDate ? new Date(quiz.startDate) : null;
    const endDate = quiz.endDate ? new Date(quiz.endDate) : null;
    const originalStatus = quiz.status?.toUpperCase();

    if (originalStatus === 'ENDED') return 'ENDED';
    if (endDate && now > endDate) return 'ENDED';

    if (originalStatus === 'ACTIVE') {
        return (startDate && now < startDate) ? 'PUBLISHED' : 'ACTIVE';
    }
    if (originalStatus === 'PUBLISHED') {
        return (startDate && now >= startDate) ? 'ACTIVE' : 'PUBLISHED';
    }
    return quiz.status;
};

function InstructorDashboard({ user, onLogout, onChangePassword, onChangeEmail, onChangeFullName }) {
    const [instructorView, setInstructorView] = useState('dashboardOverview');
    const [allQuestions, setAllQuestions] = useState([]);
    const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
    const [questionLoadError, setQuestionLoadError] = useState(null);
    const [questionToEdit, setQuestionToEdit] = useState(null);

    const [currentExamDetails, setCurrentExamDetails] = useState({
        id: null, title: '', description: '', durationMinutes: 60, startDate: '', endDate: '', passingScore: 50, questionIds: []
    });
    const [currentExamQuestions, setCurrentExamQuestions] = useState([]);
    const [isEditingExam, setIsEditingExam] = useState(false);
    const [examToEditId, setExamToEditId] = useState(null);

    const [savedExams, setSavedExams] = useState([]);
    const [isLoadingExams, setIsLoadingExams] = useState(false);
    const [examsError, setExamsError] = useState(null);

    const [isSubmittingExam, setIsSubmittingExam] = useState(false);
    const [isSubmittingDraft, setIsSubmittingDraft] = useState(false);
    const [detailedExamResults, setDetailedExamResults] = useState(null);
    const [selectedExamIdForResults, setSelectedExamIdForResults] = useState(null);
    const [isLoadingResults, setIsLoadingResults] = useState(false);

    const [showStudentReviewModal, setShowStudentReviewModal] = useState(false);
    const [reviewDataForModal, setReviewDataForModal] = useState(null);
    const [isLoadingStudentReview, setIsLoadingStudentReview] = useState(false);
    const [studentReviewError, setStudentReviewError] = useState(null);

    const [questionCreationOrigin, setQuestionCreationOrigin] = useState(null);

    useEffect(() => {
        console.log('[InstructorDashboard] View/Details Update:', {
            view: instructorView,
            currentExamDetailsId: currentExamDetails?.id,
            currentExamDetailsTitle: currentExamDetails?.title,
            currentExamQuestionsCount: currentExamQuestions.length,
            isEditingExamFlag: isEditingExam,
            examToEditIdActual: examToEditId,
            questionCreationOriginContext: questionCreationOrigin
        });
    }, [instructorView, currentExamDetails, currentExamQuestions, isEditingExam, examToEditId, questionCreationOrigin]);


    const fetchAllQuestions = useCallback(async () => {
        setIsLoadingQuestions(true); setQuestionLoadError(null);
        try {
            const response = await axios.get(`${QUESTION_SERVICE_URL}/allQuestions`, { withCredentials: true });
            if (Array.isArray(response.data)) {
                const formattedQuestions = response.data.map(q => ({
                    id: q.id.toString(), text: q.questiontitle, type: q.type, category: q.category, points: q.points, difficultylevel: q.difficultylevel, title: q.title,
                    ...(q.type === 'MCQ' && { options: [q.option1, q.option2, q.option3, q.option4].filter(opt => opt != null),
                        answer: (() => { const opts = [q.option1, q.option2, q.option3, q.option4]; const idx = opts.findIndex(opt => opt && opt.trim() === q.rightanswer?.trim()); return idx !== -1 ? String.fromCharCode(65 + idx) : ''; })() }),
                    ...(q.type === 'TF' && { answer: q.rightanswer }), ...(q.type === 'Short Answer' && { answer: q.rightanswer }),
                    lastModified: q.lastModified || new Date().toISOString()
                }));
                setAllQuestions(formattedQuestions);
            } else { throw new Error("Invalid data format for questions."); }
        } catch (error) { let message = "Could not load questions."; if (error.response) { message = `Error ${error.response.status}: ${error.response.data?.message || 'Failed to fetch questions.'}`; } else if (error.request) { message = "Cannot connect to question service."; } else { message = `Unexpected error: ${error.message}`; } setQuestionLoadError(message); setAllQuestions([]);
        } finally { setIsLoadingQuestions(false); }
    }, []);

    useEffect(() => { fetchAllQuestions(); }, [fetchAllQuestions]);

    const fetchSavedExams = useCallback(async () => {
        setIsLoadingExams(true); setExamsError(null);
        try {
            const response = await axios.get(`${QUIZ_SERVICE_URL}/instructor/all`, { withCredentials: true });
            if (Array.isArray(response.data)) {
                const formattedExams = response.data.map(exam => ({ ...exam, id: exam.id.toString(), status: determineDynamicStatusForView(exam), questions: exam.questionIds ? exam.questionIds.length : 0, duration: exam.durationMinutes }));
                setSavedExams(formattedExams);
            } else { throw new Error("Invalid data format for saved exams."); }
        } catch (error) { let message = "Could not load your exams."; if (error.response) { message = `Error ${error.response.status}: ${error.response.data?.message || 'Failed to fetch exams.'}`; } else if (error.request) { message = "Cannot connect to exam service."; } else { message = `Unexpected error: ${error.message}`; } setExamsError(message); setSavedExams([]);
        } finally { setIsLoadingExams(false); }
    }, []);

    useEffect(() => { if (instructorView === 'viewExams' || instructorView === 'dashboardOverview') { fetchSavedExams(); } }, [instructorView, fetchSavedExams]);

    const resetExamFlowState = () => {
        setCurrentExamDetails({ id: null, title: '', description: '', durationMinutes: 60, startDate: '', endDate: '', passingScore: 50, questionIds: [] });
        setCurrentExamQuestions([]);
        setIsEditingExam(false);
        setExamToEditId(null);
        setQuestionCreationOrigin(null);
    };


    const handleMenuClick = (viewName) => {
        const examFlowViews = ['createExam', 'addToExamPool', 'createOrEditQuestion'];
        if (!examFlowViews.includes(viewName) && examFlowViews.includes(instructorView)) {
            resetExamFlowState();
        }
        if (viewName !== 'createOrEditQuestion') { setQuestionToEdit(null); }
        if (viewName !== 'createOrEditQuestion' && questionCreationOrigin) {
            setQuestionCreationOrigin(null);
        }
        if (viewName !== 'examResults') { setDetailedExamResults(null); setSelectedExamIdForResults(null); }
        if (viewName !== 'studentExamReview' && !showStudentReviewModal) { setReviewDataForModal(null); }
        setInstructorView(viewName);
        if (viewName === 'viewExams' && (savedExams.length === 0 || examsError)) { fetchSavedExams(); }
        if ((viewName === 'questionPool' || viewName === 'addToExamPool') && allQuestions.length === 0 && !isLoadingQuestions) { fetchAllQuestions(); }
    };

    const navigateToCreateExam = () => {
        resetExamFlowState();
        setInstructorView('createExam');
    };


    const preserveAndNavigateToCreateQuestion = (formDataFromCreatePage) => {
        setQuestionToEdit(null);

        if (instructorView === 'createExam') {
            if (formDataFromCreatePage) {
                setCurrentExamDetails(prevDetails => ({
                    ...prevDetails,
                    title: formDataFromCreatePage.title,
                    description: formDataFromCreatePage.description,
                    durationMinutes: formDataFromCreatePage.durationMinutes,
                    startDate: formDataFromCreatePage.startDate,
                    endDate: formDataFromCreatePage.endDate,
                    passingScore: formDataFromCreatePage.passingScore,
                }));
            }
            setQuestionCreationOrigin(examToEditId ? 'createExamFlow_editExisting' : 'createExamFlow');

        } else {
            setQuestionCreationOrigin('questionPoolFlow');
        }
        setInstructorView('createOrEditQuestion');
    };


    const handleNavigateToEditQuestion = (questionId) => {
        const q = allQuestions.find(item => item.id === questionId);
        if (q) {
            setQuestionToEdit(q);
            if (instructorView === 'createExam') {

                setQuestionCreationOrigin('createExamFlow_editExisting');
            } else {
                setQuestionCreationOrigin('questionPoolFlow_editExisting');
            }
            setInstructorView('createOrEditQuestion');
        } else {
            alert("Question not found.");
            fetchAllQuestions();
        }
    };

    const navigateToAddToExamPool = (formDataFromCreatePage) => {
        if (formDataFromCreatePage) {
            setCurrentExamDetails(prevDetails => ({
                ...prevDetails,
                title: formDataFromCreatePage.title,
                description: formDataFromCreatePage.description,
                durationMinutes: formDataFromCreatePage.durationMinutes,
                startDate: formDataFromCreatePage.startDate,
                endDate: formDataFromCreatePage.endDate,
                passingScore: formDataFromCreatePage.passingScore,
            }));
        }
        if (allQuestions.length === 0 && !isLoadingQuestions) { fetchAllQuestions(); }
        setInstructorView('addToExamPool');
    };

    const handleBackFromQuestionCreate = (isEditingQuestion) => {
        if (questionCreationOrigin === 'createExamFlow' || questionCreationOrigin === 'createExamFlow_editExisting') {
            setInstructorView('createExam');
        } else {
            setInstructorView('questionPool');
        }
        setQuestionToEdit(null);
    };

    const handleSaveNewQuestion = async (newQuestionPayload) => {
        try {
            const response = await axios.post(`${QUESTION_SERVICE_URL}/add`, newQuestionPayload, { withCredentials: true });
            if (response.status === 201 && response.data?.id != null) {
                const savedQuestion = response.data;
                const formattedSavedQuestion = {
                    id: savedQuestion.id.toString(), text: savedQuestion.questiontitle, type: savedQuestion.type, category: savedQuestion.category, points: savedQuestion.points, difficultylevel: savedQuestion.difficultylevel, title: savedQuestion.title,
                    ...(savedQuestion.type === 'MCQ' && { options: [savedQuestion.option1, savedQuestion.option2, savedQuestion.option3, savedQuestion.option4].filter(opt => opt != null), answer: (() => { const opts = [savedQuestion.option1, savedQuestion.option2, savedQuestion.option3, savedQuestion.option4]; const idx = opts.findIndex(opt => opt && opt.trim() === savedQuestion.rightanswer?.trim()); return idx !== -1 ? String.fromCharCode(65 + idx) : ''; })() }),
                    ...(savedQuestion.type === 'TF' && { answer: savedQuestion.rightanswer }),
                    ...(savedQuestion.type === 'Short Answer' && { answer: savedQuestion.rightanswer }),
                    lastModified: savedQuestion.lastModified || new Date().toISOString()
                };

                setAllQuestions(prevQuestions => [...prevQuestions, formattedSavedQuestion]);
                alert(`Question "${formattedSavedQuestion.text.substring(0,30)}..." added successfully!`);

                if (questionCreationOrigin === 'createExamFlow' || questionCreationOrigin === 'createExamFlow_editExisting') {
                    setCurrentExamQuestions(prevExamQs => [...prevExamQs, formattedSavedQuestion]);
                    setCurrentExamDetails(prevDetails => ({
                        ...prevDetails,
                        questionIds: [...(prevDetails.questionIds || []), parseInt(savedQuestion.id, 10)]
                    }));
                }
                handleBackFromQuestionCreate(false);
            } else { throw new Error("Backend save successful but returned invalid data"); }
        } catch (error) {
            let errorMsg = "Failed to save question.";
            if (error.response) { errorMsg = `Could not save: ${error.response.data?.message || 'Invalid data.'}`; }
            else if (error.request) { errorMsg = "Cannot connect to server."; }
            else { errorMsg = error.message || "An unknown error occurred."; }
            alert(`Error: ${errorMsg}`);
        }
    };

    const handleUpdateQuestion = async (updatedQuestionPayload) => {
        try {
            const response = await axios.put(`${QUESTION_SERVICE_URL}/update/${updatedQuestionPayload.id}`, updatedQuestionPayload, { withCredentials: true });
            if (response.status === 200 && response.data?.id != null) {
                const updatedQuestionFromBackend = response.data;
                const formattedUpdatedQuestion = {
                    id: updatedQuestionFromBackend.id.toString(), text: updatedQuestionFromBackend.questiontitle, type: updatedQuestionFromBackend.type, category: updatedQuestionFromBackend.category, points: updatedQuestionFromBackend.points, difficultylevel: updatedQuestionFromBackend.difficultylevel, title: updatedQuestionFromBackend.title,
                    ...(updatedQuestionFromBackend.type === 'MCQ' && { options: [updatedQuestionFromBackend.option1, updatedQuestionFromBackend.option2, updatedQuestionFromBackend.option3, updatedQuestionFromBackend.option4].filter(opt => opt != null), answer: (() => { const opts = [updatedQuestionFromBackend.option1, updatedQuestionFromBackend.option2, updatedQuestionFromBackend.option3, updatedQuestionFromBackend.option4]; const idx = opts.findIndex(opt => opt && opt.trim() === updatedQuestionFromBackend.rightanswer?.trim()); return idx !== -1 ? String.fromCharCode(65 + idx) : ''; })() }),
                    ...(updatedQuestionFromBackend.type === 'TF' && { answer: updatedQuestionFromBackend.rightanswer }),
                    ...(updatedQuestionFromBackend.type === 'Short Answer' && { answer: updatedQuestionFromBackend.rightanswer }),
                    lastModified: updatedQuestionFromBackend.lastModified || new Date().toISOString()
                };

                setAllQuestions(prev => prev.map(q => (q.id === formattedUpdatedQuestion.id ? formattedUpdatedQuestion : q)));

                const isQuestionInCurrentExam = currentExamQuestions.some(q => q.id === formattedUpdatedQuestion.id);
                if (questionCreationOrigin === 'createExamFlow_editExisting' || isQuestionInCurrentExam) {
                    setCurrentExamQuestions(prevExamQs =>
                        prevExamQs.map(q => (q.id === formattedUpdatedQuestion.id ? formattedUpdatedQuestion : q))
                    );
                }

                alert(`Question ID ${formattedUpdatedQuestion.id} updated successfully!`);
                handleBackFromQuestionCreate(true); // Navigate back
            } else { throw new Error("Backend update successful but returned invalid data"); }
        } catch (error) {
            let errorMsg = "Failed to update question.";
            if (error.response) { if (error.response.status === 404) { errorMsg = "Question not found on server."; } else if (error.response.status === 400) { errorMsg = `Could not update: ${error.response.data?.message || 'Invalid data.'}`; } else { errorMsg = `Server Error: ${error.response.status} - ${error.response.data?.message || 'Unknown server error.'}`; } }
            else if (error.request) { errorMsg = "Cannot connect to server."; }
            else { errorMsg = error.message || "An unknown error occurred."; }
            alert(`Error: ${errorMsg}`);
        }
    };

    const handleDeleteQuestionFromPool = async (id) => { const questionToDelete = allQuestions.find(q => q.id === id); if (!questionToDelete) { alert("Question not found."); return; } if (window.confirm(`Delete question "${questionToDelete.text.substring(0, 50)}..."?`)) { setIsLoadingQuestions(true); try { await axios.delete(`${QUESTION_SERVICE_URL}/delete/${id}`, { withCredentials: true }); setAllQuestions(prev => prev.filter(q => q.id !== id)); setCurrentExamQuestions(prev => prev.filter(q => q.id !== id)); alert(`Question ID ${id} deleted.`); } catch (error) { let msg = "Failed to delete question."; if (error.response) { if (error.response.status === 404) { msg = "Question not on server."; } else if (error.response.status === 409) { msg = `Could not delete: ${error.response.data?.message || 'In use.'}`; } else { msg = `Server Error: ${error.response.status} - ${error.response.data?.message || 'Unknown server error.'}`; } } else if (error.request) { msg = "Cannot connect to server."; } else { msg = error.message || "An unknown error occurred."; } alert(`Error: ${msg}`); } finally { setIsLoadingQuestions(false); } } };
    const handleRemoveQuestionFromExam = (questionIdToRemove) => { const updatedQuestions = currentExamQuestions.filter(q => q.id !== questionIdToRemove); setCurrentExamQuestions(updatedQuestions); setCurrentExamDetails(prevDetails => ({ ...prevDetails, questionIds: updatedQuestions.map(q => parseInt(q.id, 10)) })); };
    const handleAddQuestionsFromPool = useCallback((selectedQuestionIdsSet) => { const questionsToAdd = allQuestions.filter(q => selectedQuestionIdsSet.has(q.id.toString())); setCurrentExamQuestions(prevExamQuestions => { const currentIds = new Set(prevExamQuestions.map(q => q.id.toString())); const newUniqueQuestions = questionsToAdd.filter(q => !currentIds.has(q.id.toString())); const updatedFullQuestions = [...prevExamQuestions, ...newUniqueQuestions]; setCurrentExamDetails(prevDetails => ({ ...prevDetails, questionIds: updatedFullQuestions.map(q => parseInt(q.id, 10)) })); return updatedFullQuestions; }); setInstructorView('createExam'); }, [allQuestions]);
    const handleCancelAddFromPool = useCallback(() => { setInstructorView('createExam'); }, []);

    const handleSaveDraft = async (examDataFromCreatePage) => {
        if (isSubmittingDraft || isSubmittingExam) return;
        setIsSubmittingDraft(true);
        const idForOperation = examDataFromCreatePage.id || currentExamDetails.id;

        const payload = {
            title: examDataFromCreatePage.title, description: examDataFromCreatePage.description,
            durationMinutes: examDataFromCreatePage.durationMinutes, startDate: examDataFromCreatePage.startDate || null,
            endDate: examDataFromCreatePage.endDate || null, passingScore: examDataFromCreatePage.passingScore,
            questionIds: examDataFromCreatePage.questionIds.map(id => parseInt(id, 10)),
            status: "DRAFT"
        };
        try {
            let response;
            if (idForOperation) {
                response = await axios.put(`${QUIZ_SERVICE_URL}/update-draft/${idForOperation}`, payload, { withCredentials: true });
            } else {
                response = await axios.post(`${QUIZ_SERVICE_URL}/save-draft`, payload, { withCredentials: true });
            }
            if ((response.status === 200 || response.status === 201) && response.data) {
                alert(`Exam "${response.data.title}" saved as DRAFT successfully!`);
                resetExamFlowState();
                fetchSavedExams();
                handleMenuClick('viewExams');
            } else { throw new Error(`Unexpected response from server: ${response.status}`); }
        } catch (error) {
            let msg = "Failed to save exam as draft.";
            if (error.response) { msg = `Error ${error.response.status}: ${error.response.data?.message || error.response.data || 'Server error.'}`; }
            else if (error.request) { msg = "Cannot connect to server."; }
            else { msg = error.message || "An unknown error occurred."; }
            alert(`Error: ${msg}`);
        } finally { setIsSubmittingDraft(false); }
    };

    const handlePublishOrCreateExam = async (examDataFromCreatePage) => {
        if (isSubmittingExam || isSubmittingDraft) return;
        setIsSubmittingExam(true);
        const idForOperation = examDataFromCreatePage.id || currentExamDetails.id;
        const payload = {
            title: examDataFromCreatePage.title, description: examDataFromCreatePage.description,
            durationMinutes: examDataFromCreatePage.durationMinutes, startDate: examDataFromCreatePage.startDate || null,
            endDate: examDataFromCreatePage.endDate || null, passingScore: examDataFromCreatePage.passingScore,
            questionIds: examDataFromCreatePage.questionIds.map(id => parseInt(id, 10)),
            status: "PUBLISHED"
        };
        try {
            let response;
            if (idForOperation) {
                response = await axios.put(`${QUIZ_SERVICE_URL}/update/${idForOperation}`, payload, { withCredentials: true });
            } else {
                response = await axios.post(`${QUIZ_SERVICE_URL}/save`, payload, { withCredentials: true });
            }
            if ((response.status === 200 || response.status === 201) && response.data) {
                alert(`Exam "${response.data.title}" ${idForOperation ? 'updated and published' : 'published'} successfully!`);
                resetExamFlowState();
                fetchSavedExams();
                handleMenuClick('viewExams');
            } else { throw new Error(`Unexpected response: ${response.status}`); }
        } catch (error) {
            let msg = `Failed to ${idForOperation ? 'update and publish' : 'publish'} exam.`;
            if (error.response) { msg = `Error ${error.response.status}: ${error.response.data?.message || error.response.data || 'Server error.'}`; }
            else if (error.request) { msg = "Cannot connect to server."; }
            else { msg = error.message || "An unknown error occurred."; }
            alert(`Error: ${msg}`);
        } finally { setIsSubmittingExam(false); }
    };

    const handleNavigateToEditExam = async (examIdToLoad) => {
        setIsLoadingExams(true);
        try {
            const response = await axios.get(`${QUIZ_SERVICE_URL}/details/${examIdToLoad}`, { withCredentials: true });
            if (response.data) {
                const examApi = response.data;
                let questionsForExamObjects = [];
                const examQuestionIdsInt = (examApi.questionIds || []).map(id => parseInt(id, 10));

                if (examQuestionIdsInt.length > 0) {
                    let foundInPool = allQuestions.filter(q => examQuestionIdsInt.includes(parseInt(q.id, 10)));
                    if (foundInPool.length === examQuestionIdsInt.length) {
                        questionsForExamObjects = foundInPool;
                    } else {
                        const questionsResponse = await axios.post(`${QUESTION_SERVICE_URL}/getQuestions`, examQuestionIdsInt, { withCredentials: true });
                        if(questionsResponse.data && Array.isArray(questionsResponse.data)) {
                            questionsForExamObjects = questionsResponse.data.map(q => ({
                                id: q.id.toString(), text: q.questiontitle, type: q.type, category: q.category, points: q.points, difficultylevel: q.difficultylevel, title: q.title,
                                ...(q.type === 'MCQ' && { options: [q.option1, q.option2, q.option3, q.option4].filter(opt => opt != null), answer: (()=>{const os=[q.option1,q.option2,q.option3,q.option4]; const ci=os.findIndex(o=>o&&o.trim()===q.rightanswer?.trim()); return ci!==-1?String.fromCharCode(65+ci):''})() }),
                                ...(q.type==='TF'&&{answer:q.rightanswer}),...(q.type==='Short Answer'&&{answer:q.rightanswer}),
                                lastModified: q.lastModified || new Date().toISOString()
                            }));
                            setAllQuestions(prevPool => {
                                const existingPoolIds = new Set(prevPool.map(pq => pq.id));
                                const newUniqueQsToPool = questionsForExamObjects.filter(fq => !existingPoolIds.has(fq.id));
                                return [...prevPool, ...newUniqueQsToPool];
                            });
                        } else { throw new Error("Could not fetch question details for the exam."); }
                    }
                }
                setCurrentExamDetails({
                    id: examApi.id.toString(), title: examApi.title || '', description: examApi.description || '',
                    durationMinutes: examApi.durationMinutes || 60, startDate: examApi.startDate,
                    endDate: examApi.endDate, passingScore: examApi.passingScore || 50,
                    questionIds: examQuestionIdsInt,
                    status: examApi.status
                });
                setCurrentExamQuestions(questionsForExamObjects);
                setIsEditingExam(true);
                setExamToEditId(examApi.id.toString());
                setQuestionCreationOrigin(null);
                setInstructorView('createExam');
            } else { throw new Error("Exam details not found."); }
        } catch (error) { alert("Could not load exam details for editing. " + (error.message || "")); setExamsError("Failed to load exam for editing.");
        } finally { setIsLoadingExams(false); }
    };

    const handleDeleteExam = async (examId) => { const exam = savedExams.find(e => e.id === examId); if (!exam) { alert("Exam not found."); return; } if (window.confirm(`Delete exam "${exam.title}"? This cannot be undone.`)) { setIsLoadingExams(true); try { await axios.delete(`${QUIZ_SERVICE_URL}/delete/${examId}`, { withCredentials: true }); alert(`Exam "${exam.title}" deleted.`); fetchSavedExams(); } catch (error) { let msg = "Failed to delete exam."; if (error.response) { msg = error.response.status === 404 ? "Exam not on server." : `Server Error: ${error.response.status} - ${error.response.data?.message || 'Unknown server error.'}`; if (error.response.status === 409) { msg = `Could not delete: ${error.response.data?.message || 'Active/has submissions.'}`;}} else if (error.request) { msg = "Cannot connect to server."; } else { msg = error.message || "An unknown error occurred."; } alert(`Error: ${msg}`); } finally { setIsLoadingExams(false); } } };
    const handleViewExamResults = async (examId) => { if (!examId) { alert("Invalid Exam ID for viewing results."); return; } setIsLoadingResults(true); setDetailedExamResults(null); setSelectedExamIdForResults(examId); setShowStudentReviewModal(false); try { const response = await axios.get(`${QUIZ_SERVICE_URL}/${examId}/results`, { withCredentials: true }); if (response.data && typeof response.data === 'object' && response.data.quizTitle) { setDetailedExamResults(response.data); setInstructorView('examResults'); } else { throw new Error("No valid results data received or quizTitle is missing."); } } catch (error) { let errorMsg = "Could not load exam results."; if (error.response) { errorMsg = `Error ${error.response.status}: ${error.response.data?.message || 'Failed to fetch results.'}`; } else if (error.request) { errorMsg = "Cannot connect to server for results."; } else { errorMsg = `Unexpected error: ${error.message}`; } alert(errorMsg); setDetailedExamResults(null); setSelectedExamIdForResults(null); setInstructorView('viewExams'); } finally { setIsLoadingResults(false); } };
    const fetchAndShowStudentReview = useCallback(async (submissionId) => { if (!submissionId) { alert("Invalid submission ID."); return; } setIsLoadingStudentReview(true); setStudentReviewError(null); setReviewDataForModal(null); try { const response = await axios.get(`${QUIZ_SERVICE_URL}/instructor/submission/${submissionId}/review`, { withCredentials: true }); if (response.data && response.data.submissionId) { setReviewDataForModal(response.data); setShowStudentReviewModal(true); } else { throw new Error("Invalid review data received from server for student submission."); } } catch (error) { let msg = "Could not load student submission details."; if (error.response) { msg = `Error ${error.response.status}: ${error.response.data?.message || 'Failed to fetch review.'}`; } else if (error.request) { msg = "Cannot connect to the server to retrieve submission details."; } else { msg = error.message || "An unknown error occurred while fetching student review."; } setStudentReviewError(msg); setReviewDataForModal(null); setShowStudentReviewModal(true); } finally { setIsLoadingStudentReview(false); } }, []);
    const handleUpdateStudentScore = async (submissionId, quizId, newTotalAchievedPoints, individualScoresMap) => { try { const payload = { newTotalAchievedPoints: newTotalAchievedPoints, individualQuestionScores: individualScoresMap }; const response = await axios.put( `${QUIZ_SERVICE_URL}/instructor/submission/${submissionId}/update-score`, payload, { withCredentials: true } ); if (response.status === 200 && response.data) { alert("Student's score and individual question scores updated successfully!"); setShowStudentReviewModal(false); if (selectedExamIdForResults && selectedExamIdForResults === quizId.toString() && instructorView === 'examResults') { await handleViewExamResults(selectedExamIdForResults); } } else { throw new Error(response.data?.message || "Failed to update score on server."); } } catch (error) { let errorMsg = "Failed to update student score."; if (error.response) { errorMsg = `Error ${error.response.status}: ${error.response.data?.message || 'Server error during score update.'}`; } else if (error.request) { errorMsg = "Cannot connect to the server to update score."; } else { errorMsg = error.message || "An unknown error occurred."; } alert(errorMsg); } };

    const currentQuestionIdsInExamForPool = useMemo(() => new Set(currentExamQuestions.map(q => q.id.toString())), [currentExamQuestions]);
    const genelYuklemeDurumu = isLoadingExams || isLoadingQuestions || isLoadingResults || isSubmittingExam || isSubmittingDraft || isLoadingStudentReview;

    const renderContent = () => {
        if (isLoadingExams && instructorView === 'viewExams' && savedExams.length === 0) { return <div className="loading-placeholder"><FontAwesomeIcon icon={faSpinner} spin size="2x" /><p>Loading exams...</p></div>; }
        if (examsError && instructorView === 'viewExams') { return <div className="error-message-container widget-card"><FontAwesomeIcon icon={faExclamationTriangle} size="2x" /><p>{examsError}</p><button onClick={fetchSavedExams} className="widget-button secondary">Retry</button></div>; }
        if (isLoadingResults && instructorView === 'examResults' && !detailedExamResults && !studentReviewError) { return <div className="loading-placeholder"><FontAwesomeIcon icon={faSpinner} spin size="2x" /><p>Loading exam results...</p></div>; }
        const commonLoadingMessage = isSubmittingDraft ? 'Saving draft...' : isSubmittingExam ? 'Submitting exam...' : '';
        if ((isSubmittingExam || isSubmittingDraft) && instructorView === 'createExam') { return <div className="loading-placeholder"><FontAwesomeIcon icon={faSpinner} spin size="2x" /><p>{commonLoadingMessage}</p></div>; }
        if (isLoadingQuestions && (instructorView === 'questionPool' || instructorView === 'addToExamPool') && allQuestions.length === 0) { return <div className="loading-placeholder"><FontAwesomeIcon icon={faSpinner} spin size="2x" /><p>Loading questions...</p></div>; }
        if (questionLoadError && (instructorView === 'questionPool' || instructorView === 'addToExamPool')) { return <div className="error-message-container widget-card"><FontAwesomeIcon icon={faExclamationTriangle} size="2x" /><p>{questionLoadError}</p><button onClick={fetchAllQuestions} className="widget-button secondary">Retry</button></div>; }

        switch(instructorView) {
            case 'createExam': return <CreateExamPage key={examToEditId || currentExamDetails.id || 'new-exam-key'} initialDetails={currentExamDetails} initialQuestions={currentExamQuestions} onRemoveQuestion={handleRemoveQuestionFromExam} onNavigateToCreateQuestion={preserveAndNavigateToCreateQuestion} onNavigateToAddToExamPool={navigateToAddToExamPool} onSaveDraft={handleSaveDraft} onPublish={handlePublishOrCreateExam} />;
            case 'createOrEditQuestion': return <CreateQuestionPage key={questionToEdit ? `edit-${questionToEdit.id}` : 'new-question-key'} initialQuestionData={questionToEdit} onSave={handleSaveNewQuestion} onUpdate={handleUpdateQuestion} onBack={() => handleBackFromQuestionCreate(!!questionToEdit)} />;
            case 'viewExams': return <ViewExamsPage examsData={savedExams} isLoading={isLoadingExams && savedExams.length === 0} error={examsError} onRetryFetch={fetchSavedExams} onEditExam={handleNavigateToEditExam} onDeleteExam={handleDeleteExam} onViewResults={handleViewExamResults} onNavigateToCreate={navigateToCreateExam} />;
            case 'questionPool': return <QuestionPoolPage mode="poolManagement" questions={allQuestions} isLoading={isLoadingQuestions && allQuestions.length === 0} error={questionLoadError} onRetryFetch={fetchAllQuestions} onNavigateToCreate={preserveAndNavigateToCreateQuestion} onEditQuestion={handleNavigateToEditQuestion} onDeleteQuestion={handleDeleteQuestionFromPool} existingQuestionIdsInExam={new Set()} />;
            case 'addToExamPool': return <QuestionPoolPage mode="addToExam" questions={allQuestions} isLoading={isLoadingQuestions && allQuestions.length === 0} error={questionLoadError} onRetryFetch={fetchAllQuestions} onAddSelectedToExam={handleAddQuestionsFromPool} onCancel={handleCancelAddFromPool} existingQuestionIdsInExam={currentQuestionIdsInExamForPool} />;
            case 'examResults': if (isLoadingResults && !detailedExamResults) { return <div className="loading-placeholder"><FontAwesomeIcon icon={faSpinner} spin size="2x" /><p>Loading results...</p></div>; } if (!detailedExamResults && !isLoadingResults) { return ( <div className="error-message-container widget-card"> <FontAwesomeIcon icon={faInfoCircle} size="2x" style={{color: 'var(--text-medium)', marginBottom: '15px'}}/> <h4>Results Not Available</h4> <p>Could not load results for the selected exam (ID: {selectedExamIdForResults || 'N/A'}). This exam might not have any submissions yet or an error occurred.</p> <button onClick={() => handleMenuClick('viewExams')} className="widget-button secondary">Back to Manage Exams</button> </div> ); } return <InstructorExamResultsPage examResults={detailedExamResults} onBackToExams={() => handleMenuClick('viewExams')} onViewStudentSubmission={fetchAndShowStudentReview} />;
            case 'dashboardOverview': default: return ( <div className="widgets-container"> <div className="widget-card accent-border-left animated-fade-in-up" onClick={navigateToCreateExam} style={{cursor:'pointer', animationDelay: '0.1s'}}> <FontAwesomeIcon icon={faPlusSquare} className="widget-icon accent-color" /> <div className="widget-content"> <h4>Create New Exam</h4> <p>Design and publish a new exam for your students.</p> <button className="widget-button primary">Start Creating</button> </div> </div> <div className="widget-card accent-border-left animated-fade-in-up" onClick={() => handleMenuClick('questionPool')} style={{cursor:'pointer', animationDelay: '0.2s'}}> <FontAwesomeIcon icon={faDatabase} className="widget-icon accent-color" /> <div className="widget-content"> <h4>Question Pool</h4> <p>Manage your question bank ({isLoadingQuestions && !allQuestions.length ? 'loading...' : `${allQuestions.length} questions`}).</p> <button className="widget-button secondary">Manage Pool</button> </div> </div> <div className="widget-card accent-border-left animated-fade-in-up" onClick={() => handleMenuClick('viewExams')} style={{cursor:'pointer', animationDelay: '0.3s'}}> <FontAwesomeIcon icon={faListAlt} className="widget-icon accent-color" /> <div className="widget-content"> <h4>View & Manage Exams</h4> <p>Review, edit existing exams, or see results ({isLoadingExams && !savedExams.length ? 'loading...' : `${savedExams.length} exams`}).</p> <button className="widget-button secondary">Manage Exams</button> </div> </div> </div> );
        }
    };

    return (
        <div className="dashboard-layout instructor-dashboard">
            <nav className="sidebar">
                <div className="sidebar-header"> <FontAwesomeIcon icon={faChalkboardTeacher} /> <h3>Instructor Panel</h3> </div>
                <ul className="nav-menu">
                    <li className={`nav-item ${instructorView === 'dashboardOverview' ? 'active' : ''} ${genelYuklemeDurumu ? 'disabled' : ''}`} onClick={() => !genelYuklemeDurumu && handleMenuClick('dashboardOverview')}> <FontAwesomeIcon icon={faChalkboardTeacher} className="nav-icon" /> <span className="nav-text">Dashboard</span> </li>
                    <li className={`nav-item ${(instructorView === 'viewExams' || instructorView === 'examResults' || instructorView === 'studentExamReview' || (instructorView === 'createExam' && examToEditId)) ? 'active' : ''} ${genelYuklemeDurumu ? 'disabled' : ''}`} onClick={() => !genelYuklemeDurumu && handleMenuClick('viewExams')}> <FontAwesomeIcon icon={faListAlt} className="nav-icon" /> <span className="nav-text">Manage Exams</span> </li>
                    <li className={`nav-item ${(instructorView === 'questionPool' || (instructorView === 'createOrEditQuestion' && !examToEditId && !questionCreationOrigin?.startsWith('createExamFlow')) || instructorView === 'addToExamPool') ? 'active' : ''} ${genelYuklemeDurumu ? 'disabled' : ''}`} onClick={() => !genelYuklemeDurumu && handleMenuClick('questionPool')}> <FontAwesomeIcon icon={faDatabase} className="nav-icon" /> <span className="nav-text">Question Pool</span> </li>
                    <li className={`nav-item ${(instructorView === 'createExam' && !examToEditId) || (instructorView === 'createOrEditQuestion' && !questionToEdit && questionCreationOrigin?.startsWith('createExamFlow')) ? 'active' : ''} ${genelYuklemeDurumu ? 'disabled' : ''}`} onClick={() => !genelYuklemeDurumu && navigateToCreateExam()}> <FontAwesomeIcon icon={faPlusSquare} className="nav-icon" /> <span className="nav-text">Create Exam</span> </li>
                </ul>
                <div className="sidebar-footer"> <button className="logout-button" onClick={onLogout} disabled={genelYuklemeDurumu}> <FontAwesomeIcon icon={faSignOutAlt} className="nav-icon" /> <span className="nav-text">Logout</span> </button> </div>
            </nav>
            <main className="main-content">
                <header className="content-header"><h1>
                    {instructorView === 'dashboardOverview' && 'Dashboard Overview'}
                    {instructorView === 'createExam' && (examToEditId && currentExamDetails?.title ? `Edit Exam: ${currentExamDetails.title}` : 'Create New Exam')}
                    {instructorView === 'createOrEditQuestion' && (questionToEdit ? `Edit Question ID: ${questionToEdit.id}` : (questionCreationOrigin?.startsWith('createExamFlow') ? 'Create New Question for Exam' : 'Create New Question'))}
                    {instructorView === 'viewExams' && 'View & Manage Exams'}
                    {instructorView === 'questionPool' && 'Question Pool Management'}
                    {instructorView === 'addToExamPool' && `Add Questions to: ${currentExamDetails?.title || 'New Exam'}`}
                    {instructorView === 'examResults' && (detailedExamResults?.quizTitle ? `Results: ${detailedExamResults.quizTitle}`: (isLoadingResults? 'Loading Results...' : 'Exam Results'))}
                </h1>
                    <ProfileDropdown
                        user={user}
                        onLogout={onLogout}
                        onChangePassword={onChangePassword}
                        onChangeEmail={onChangeEmail}
                        onChangeFullName={onChangeFullName}
                    />
                </header>
                <div className="content-body">
                    {renderContent()}
                    {showStudentReviewModal && (
                        <div className="modal-overlay large-modal-overlay" onClick={() => { setShowStudentReviewModal(false); }}>
                            <div className="modal-content large-modal" style={{maxWidth: '950px', maxHeight: '90vh', display: 'flex', flexDirection: 'column'}} onClick={e => e.stopPropagation()}>
                                <div className="modal-header">
                                    <h3> <FontAwesomeIcon icon={faEye} style={{ marginRight: '10px' }} /> {isLoadingStudentReview ? 'Loading Review...' : studentReviewError ? 'Error Loading Review' : reviewDataForModal?.quizTitle ? `Submission Review: ${reviewDataForModal.quizTitle}` : 'Submission Review'} </h3>
                                    <button onClick={() => { setShowStudentReviewModal(false); }} className="modal-close-button"> <FontAwesomeIcon icon={faTimes} /> </button>
                                </div>
                                <div className="modal-body" style={{flexGrow: 1, overflowY: 'auto', padding: '0'}}>
                                    {isLoadingStudentReview && ( <div className="loading-placeholder" style={{paddingTop: '50px'}}><FontAwesomeIcon icon={faSpinner} spin size="2x" /><p>Loading submission details...</p></div> )}
                                    {!isLoadingStudentReview && studentReviewError && ( <div className="error-message-container widget-card" style={{margin: '20px'}}> <FontAwesomeIcon icon={faExclamationTriangle} size="2x" style={{color: 'var(--error-color)', marginBottom: '15px'}}/> <h4>Failed to Load Review</h4> <p>{studentReviewError}</p> <button onClick={() => setShowStudentReviewModal(false)} className="widget-button secondary">Close</button> </div> )}
                                    {!isLoadingStudentReview && !studentReviewError && reviewDataForModal && (
                                        <InstructorStudentReviewPage
                                            examReviewData={reviewDataForModal}
                                            onBack={() => { setShowStudentReviewModal(false); }}
                                            onUpdateTotalScore={handleUpdateStudentScore}
                                        />
                                    )}
                                    {!isLoadingStudentReview && !studentReviewError && !reviewDataForModal && ( <div className="error-message-container widget-card" style={{margin: '20px'}}> <FontAwesomeIcon icon={faInfoCircle} size="2x" style={{color: 'var(--text-medium)', marginBottom: '15px'}}/> <h4>No Review Data</h4> <p>The review data for this submission could not be loaded or is unavailable.</p> <button onClick={() => setShowStudentReviewModal(false)} className="widget-button secondary">Close</button> </div> )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
            <style jsx>{`
                .nav-item.disabled, .logout-button:disabled { cursor: not-allowed; opacity: 0.6; }
                .nav-item.disabled:hover { background-color: transparent; border-left-color: transparent; color: var(--text-medium); }
                .nav-item.disabled:hover .nav-icon { color: var(--text-medium); }
                .content-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-light); padding-bottom: 18px; margin-bottom: 35px; }
                .content-header h1 { margin: 0; }
            `}</style>
        </div>
    );
}
export default InstructorDashboard;
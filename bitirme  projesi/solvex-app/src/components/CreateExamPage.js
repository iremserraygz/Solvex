import React, { useState, useEffect } from 'react';
import '../App.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {  faTrashAlt, faSave, faUpload,  faClock, faPercentage, faCalendarAlt, faBookOpen, faPencilAlt } from '@fortawesome/free-solid-svg-icons';

const DEFAULT_DURATION = 60;
const DEFAULT_PASSING_SCORE = 50;

function CreateExamPage({
                            initialDetails,
                            initialQuestions = [],
                            onRemoveQuestion,
                            onNavigateToCreateQuestion,
                            onNavigateToAddToExamPool,
                            onSaveDraft,
                            onPublish
                        }) {

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [duration, setDuration] = useState(DEFAULT_DURATION.toString());
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [passingScore, setPassingScore] = useState(DEFAULT_PASSING_SCORE.toString());

    useEffect(() => {
        console.log("[CreateExamPage] useEffect triggered by initialDetails change:", initialDetails);
        if (initialDetails) {
            setTitle(initialDetails.title || '');
            setDescription(initialDetails.description || '');
            setDuration(
                initialDetails.durationMinutes !== undefined && initialDetails.durationMinutes !== null
                    ? initialDetails.durationMinutes.toString()
                    : DEFAULT_DURATION.toString()
            );
            setPassingScore(
                initialDetails.passingScore !== undefined && initialDetails.passingScore !== null
                    ? initialDetails.passingScore.toString()
                    : DEFAULT_PASSING_SCORE.toString()
            );

            const formatForInput = (dateTimeString) => {
                if (!dateTimeString) return '';
                try {
                    if (typeof dateTimeString === 'string' && dateTimeString.includes('T') && dateTimeString.length >= 16) {
                        return dateTimeString.substring(0, 16);
                    }
                    const date = new Date(dateTimeString);
                    if (!isNaN(date.getTime())) {
                        const year = date.getFullYear();
                        const month = (date.getMonth() + 1).toString().padStart(2, '0');
                        const day = date.getDate().toString().padStart(2, '0');
                        const hours = date.getHours().toString().padStart(2, '0');
                        const minutes = date.getMinutes().toString().padStart(2, '0');
                        return `${year}-${month}-${day}T${hours}:${minutes}`;
                    }
                } catch (e) { console.error("Error parsing date for input:", dateTimeString, e); }
                return '';
            };

            setStartDate(formatForInput(initialDetails.startDate));
            setEndDate(formatForInput(initialDetails.endDate));
        } else {
            setTitle('');
            setDescription('');
            setDuration(DEFAULT_DURATION.toString());
            setPassingScore(DEFAULT_PASSING_SCORE.toString());
            setStartDate('');
            setEndDate('');
        }
    }, [initialDetails]);


    const getExamDataPayload = () => {
        const currentDurationNum = parseInt(duration, 10);
        const currentPassingScoreNum = parseInt(passingScore, 10);

        const payload = {
            title: title.trim(),
            description: description.trim(),
            durationMinutes: isNaN(currentDurationNum) || currentDurationNum <=0 ? DEFAULT_DURATION : currentDurationNum,
            startDate: startDate || null,
            endDate: endDate || null,
            passingScore: isNaN(currentPassingScoreNum) || currentPassingScoreNum < 0 || currentPassingScoreNum > 100 ? DEFAULT_PASSING_SCORE : currentPassingScoreNum,
            questionIds: initialQuestions.map(q => parseInt(q.id, 10))
        };
        if (initialDetails && initialDetails.id) {
            payload.id = initialDetails.id;
        }
        return payload;
    };


    const handleSaveDraftClick = () => {
        if (!title.trim()) { alert("Please enter an exam title to save as draft."); return; }
        if (initialQuestions.length === 0) { alert("Please add at least one question to save the exam as a draft."); return; }
        const currentDurationNum = parseInt(duration, 10);
        if (isNaN(currentDurationNum) || currentDurationNum <= 0) { alert("Duration must be a positive number."); return; }
        const currentPassingScoreNum = parseInt(passingScore, 10);
        if (isNaN(currentPassingScoreNum) || currentPassingScoreNum < 0 || currentPassingScoreNum > 100) { alert("Passing score must be a number between 0 and 100."); return; }
        if (startDate && endDate && new Date(startDate) >= new Date(endDate)) { alert("End date/time must be after start date/time."); return; }

        const examData = getExamDataPayload();
        console.log("[CreateExamPage] Saving Draft with data:", examData);
        if (onSaveDraft) {
            onSaveDraft(examData);
        } else {
            console.error("onSaveDraft prop missing in CreateExamPage!");
        }
    };


    const handlePublishClick = () => {
        if (initialQuestions.length === 0) { alert("Please add at least one question before publishing."); return; }
        if (!title.trim()) { alert("Please enter an exam title before publishing."); return; }
        const durNum = parseInt(duration, 10);
        if (isNaN(durNum) || durNum <= 0) { alert("Duration must be a positive number."); return; }
        const passScoreNum = parseInt(passingScore, 10);
        if (isNaN(passScoreNum) || passScoreNum < 0 || passScoreNum > 100) { alert("Passing score must be between 0 and 100."); return; }
        if (startDate && endDate && new Date(startDate) >= new Date(endDate)) { alert("End date/time must be after start date/time."); return; }


        const examDataToPublish = getExamDataPayload();
        console.log("CreateExamPage: Publishing with data:", examDataToPublish);
        if (onPublish) {
            onPublish(examDataToPublish);
        } else {
            console.error("onPublish prop missing in CreateExamPage!");
            alert("Error: Cannot publish exam. Publish handler not configured.");
        }
    };

    const handleNavigateToCreateQuestionClick = () => {
        if (onNavigateToCreateQuestion) {
            const currentFormMetadata = {
                title: title.trim(),
                description: description.trim(),
                durationMinutes: parseInt(duration, 10) || DEFAULT_DURATION,
                startDate: startDate || null,
                endDate: endDate || null,
                passingScore: parseInt(passingScore, 10) || DEFAULT_PASSING_SCORE,
            };
            console.log("[CreateExamPage] Navigating to Create Question. Passing up current metadata:", currentFormMetadata);
            onNavigateToCreateQuestion(currentFormMetadata);
        } else {
            console.error("onNavigateToCreateQuestion prop is missing in CreateExamPage!");
        }
    };

    const handleAddFromPoolClick = () => {
        if (onNavigateToAddToExamPool) {
            const currentFormDetails = {
                title: title.trim(),
                description: description.trim(),
                durationMinutes: parseInt(duration, 10) || DEFAULT_DURATION,
                startDate: startDate || null,
                endDate: endDate || null,
                passingScore: parseInt(passingScore, 10) || DEFAULT_PASSING_SCORE,
            };
            console.log("[CreateExamPage] Navigating to Add From Pool. Current form details being passed up:", currentFormDetails);
            onNavigateToAddToExamPool(currentFormDetails);
        } else {
            console.error("onNavigateToAddToExamPool prop missing!");
            alert("Error: Cannot navigate to question pool selection.");
        }
    };

    return (
        <div className="create-exam-page">
            <div className="widget-card form-card animated-fade-in-up">
                <h3>
                    Exam Details {initialDetails && initialDetails.id ? `(Editing ID: ${initialDetails.id})` : '(New Exam)'}
                </h3>
                <div className="form-grid">
                    <div className="form-column">
                        <div className="input-group">
                            <label htmlFor="examTitle">Title*</label>
                            <input id="examTitle" type="text" className="input-field" value={title} onChange={e => setTitle(e.target.value)} required />
                        </div>
                        <div className="input-group">
                            <label htmlFor="examDescription">Description</label>
                            <textarea id="examDescription" className="input-field text-area" rows="4" value={description} onChange={e => setDescription(e.target.value)} />
                        </div>
                    </div>
                    <div className="form-column">
                        <div className="form-row">
                            <div className="input-group half-width">
                                <label htmlFor="examDuration"><FontAwesomeIcon icon={faClock} /> Duration (min)*</label>
                                <input id="examDuration" type="number" className="input-field" value={duration} onChange={e => setDuration(e.target.value)} min="1" required />
                            </div>
                            <div className="input-group half-width">
                                <label htmlFor="passingScore"><FontAwesomeIcon icon={faPercentage} /> Passing Score (%)*</label>
                                <input id="passingScore" type="number" className="input-field" value={passingScore} onChange={e => setPassingScore(e.target.value)} min="0" max="100" required/>
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="input-group half-width">
                                <label htmlFor="startDate"><FontAwesomeIcon icon={faCalendarAlt} /> Start Date/Time</label>
                                <input id="startDate" type="datetime-local" className="input-field" value={startDate} onChange={e => setStartDate(e.target.value)} />
                            </div>
                            <div className="input-group half-width">
                                <label htmlFor="endDate"><FontAwesomeIcon icon={faCalendarAlt} /> End Date/Time</label>
                                <input id="endDate" type="datetime-local" className="input-field" value={endDate} onChange={e => setEndDate(e.target.value)} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="widget-card questions-card animated-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <div className="questions-header">
                    <h3>Exam Questions ({initialQuestions.length})</h3>
                    <div className="question-actions">
                        <button className="widget-button secondary" onClick={handleAddFromPoolClick}>
                            <FontAwesomeIcon icon={faBookOpen} /> Add from Pool
                        </button>
                        {}
                        <button className="widget-button primary" onClick={handleNavigateToCreateQuestionClick}>
                            <FontAwesomeIcon icon={faPencilAlt} /> Create New Question
                        </button>
                    </div>
                </div>
                <ul className="question-list">
                    {initialQuestions.length === 0 && (
                        <p className="no-questions-message">No questions added to this exam yet.</p>
                    )}
                    {initialQuestions.map((q, index) => (
                        <li key={q.id} className="question-list-item" style={{ animationDelay: `${index * 0.05}s` }}>
                            <span className="question-text">{index + 1}. {q.text}</span>
                            <div className="question-details">
                                <span className="detail-chip type">{q.type}</span>
                                <span className="detail-chip points">{q.points} pts</span>
                                <button className="remove-question-btn" onClick={() => onRemoveQuestion(q.id)} title="Remove From Exam">
                                    <FontAwesomeIcon icon={faTrashAlt} />
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="action-buttons animated-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <button className="widget-button secondary" onClick={handleSaveDraftClick}>
                    <FontAwesomeIcon icon={faSave} /> Save Draft
                </button>
                <button className="widget-button primary" onClick={handlePublishClick}>
                    <FontAwesomeIcon icon={faUpload} /> {initialDetails && initialDetails.id ? 'Publish Updates' : 'Publish Exam'}
                </button>
            </div>
        </div>
    );
}
export default CreateExamPage;
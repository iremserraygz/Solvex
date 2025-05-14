import React, { useState, useEffect } from 'react';
import '../App.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrashAlt, faSave, faUpload, faList, faClock, faPercentage, faCalendarAlt, faBookOpen, faPencilAlt } from '@fortawesome/free-solid-svg-icons';

function CreateExamPage({
                            initialDetails = { title: '', description: '', durationMinutes: 60, startDate: '', endDate: '', passingScore: 50 },
                            initialQuestions = [],
                            onRemoveQuestion,
                            onNavigateToCreateQuestion,
                            onNavigateToAddToExamPool,
                            onSaveDraft,
                            onPublish
                        }) {
    const [title, setTitle] = useState(initialDetails.title);
    const [description, setDescription] = useState(initialDetails.description);
    const [duration, setDuration] = useState(initialDetails.durationMinutes); // durationMinutes'den al
    const [startDate, setStartDate] = useState(''); // Başlangıçta boş
    const [endDate, setEndDate] = useState('');   // Başlangıçta boş
    const [passingScore, setPassingScore] = useState(initialDetails.passingScore);

    useEffect(() => {
        setTitle(initialDetails.title || '');
        setDescription(initialDetails.description || '');
        setDuration(initialDetails.durationMinutes || 60);

        const formatForInput = (dateTimeString) => {
            if (!dateTimeString) return '';
            try {
                // Gelen string bir LocalDateTime objesinin .toString() hali olabilir (örn: "2023-10-26T10:30")
                // veya tam bir ISO string'i olabilir. HTML datetime-local YYYY-MM-DDTHH:mm bekler.
                if (dateTimeString.includes('T')) {
                    return dateTimeString.substring(0, 16); // Sadece YYYY-MM-DDTHH:mm kısmını al
                }
                // Eğer düz bir tarih objesi gelirse (pek olası değil ama)
                const date = new Date(dateTimeString);
                if (!isNaN(date.getTime())) {
                    // Yerel saat dilimine göre formatla
                    const year = date.getFullYear();
                    const month = (date.getMonth() + 1).toString().padStart(2, '0');
                    const day = date.getDate().toString().padStart(2, '0');
                    const hours = date.getHours().toString().padStart(2, '0');
                    const minutes = date.getMinutes().toString().padStart(2, '0');
                    return `${year}-${month}-${day}T${hours}:${minutes}`;
                }
            } catch (e) {
                console.error("Error parsing date for input:", dateTimeString, e);
            }
            return ''; // Hata durumunda veya geçersiz formatta boş döndür
        };

        setStartDate(formatForInput(initialDetails.startDate));
        setEndDate(formatForInput(initialDetails.endDate));
        setPassingScore(initialDetails.passingScore || 50);
    }, [initialDetails]);

    const handleSaveDraftClick = () => {
        const examData = {
            title: title.trim(),
            description: description.trim(),
            durationMinutes: parseInt(duration, 10) || 0,
            startDate: startDate || null, // Boşsa null gönder
            endDate: endDate || null,     // Boşsa null gönder
            passingScore: parseInt(passingScore, 10) || 0,
            questionIds: initialQuestions.map(q => q.id)
        };
        if (onSaveDraft) {
            onSaveDraft(examData);
        } else {
            console.error("onSaveDraft prop missing!");
        }
    };

    const handlePublishClick = () => {
        if (initialQuestions.length === 0) {
            alert("Please add at least one question before publishing.");
            return;
        }
        if (!title.trim()) {
            alert("Please enter an exam title before publishing.");
            return;
        }
        if (parseInt(duration, 10) <= 0) {
            alert("Duration must be a positive number.");
            return;
        }
        if (parseInt(passingScore, 10) < 0 || parseInt(passingScore, 10) > 100) {
            alert("Passing score must be between 0 and 100.");
            return;
        }
        if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
            alert("End date/time must be after start date/time.");
            return;
        }
        // Opsiyonel: Eğer başlangıç tarihi zorunluysa:
        // if (!startDate) {
        //     alert("Please set a start date and time for the exam.");
        //     return;
        // }


        const examDataToPublish = {
            title: title.trim(),
            description: description.trim(),
            durationMinutes: parseInt(duration, 10),
            startDate: startDate || null, // Backend null kabul ediyorsa
            endDate: endDate || null,     // Backend null kabul ediyorsa
            passingScore: parseInt(passingScore, 10),
            questionIds: initialQuestions.map(q => q.id)
        };

        console.log("CreateExamPage: Publishing with data:", examDataToPublish);
        if (onPublish) {
            onPublish(examDataToPublish);
        } else {
            console.error("onPublish prop missing in CreateExamPage!");
            alert("Error: Cannot publish exam. Publish handler not configured.");
        }
    };

    const handleAddFromPoolClick = () => {
        if (onNavigateToAddToExamPool) {
            onNavigateToAddToExamPool();
        } else {
            console.error("onNavigateToAddToExamPool prop missing!");
            alert("Error: Cannot navigate to question pool selection.");
        }
    };

    return (
        <div className="create-exam-page">
            <div className="widget-card form-card animated-fade-in-up">
                <h3>Exam Details</h3>
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
                        <button className="widget-button primary" onClick={onNavigateToCreateQuestion}>
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
                    <FontAwesomeIcon icon={faUpload} /> Publish Exam
                </button>
            </div>
        </div>
    );
}
export default CreateExamPage;
import React, { useState, useMemo, useEffect } from 'react';
import '../App.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faPlayCircle, faClock, faCalendarCheck, faHourglassStart,
    faFileLines, faSearch, faFilter, faInfoCircle, faCheckCircle
} from '@fortawesome/free-solid-svg-icons';

import { getExamAttemptStatusKey } from './StudentDashboard';

function StudentExamsPage({ examsData = [], onStartExam, user }) {

    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [examAttemptStatuses, setExamAttemptStatuses] = useState({});

    useEffect(() => {
        if (user?.id && Array.isArray(examsData)) {
            const newStatuses = {};
            if (examsData.length > 0) {
                examsData.forEach(exam => {
                    if (exam?.id) {
                        const statusKey = getExamAttemptStatusKey(user.id, exam.id);
                        const status = localStorage.getItem(statusKey);
                        if (status) {
                            newStatuses[exam.id.toString()] = status;
                        }
                    }
                });
            }
            setExamAttemptStatuses(newStatuses);
        }
    }, [user?.id, examsData]);


    const formatDateTime = (isoString) => {
        if (!isoString) return 'N/A';
        try {
            const date = new Date(isoString);
            if (isNaN(date.getTime())) { return "Invalid Date"; }
            return date.toLocaleString(navigator.language || 'en-US', {
                year: 'numeric', month: 'short', day: 'numeric',
                hour: '2-digit', minute: '2-digit', hour12: false
            });
        } catch (e) {
            return "Format Error";
        }
    };

    const renderStatusChip = (status) => {
        let chipClass = 'status-chip ';
        let icon = faHourglassStart;
        let displayStatus = status || "Unknown";

        switch (status?.toUpperCase()) {
            case 'PUBLISHED':
                chipClass += 'status-published';
                displayStatus = "Upcoming";
                break;
            case 'ACTIVE':
                chipClass += 'status-active';
                icon = faPlayCircle;
                displayStatus = "Available Now";
                break;
            default:
                chipClass += 'status-other';
                icon = faFileLines;
        }
        return (
            <span className={chipClass}>
                <FontAwesomeIcon icon={icon} style={{ marginRight: '6px', fontSize: '0.9em' }}/>
                {displayStatus}
            </span>
        );
    };

    const handleStartExamClick = (examId, examTitle) => {
        if (!user?.id) {
            alert("User information is not available. Cannot start exam.");
            return;
        }
        const statusKey = getExamAttemptStatusKey(user.id, examId);
        const currentLocalAttemptStatus = examAttemptStatuses[examId.toString()] || localStorage.getItem(statusKey);

        if (currentLocalAttemptStatus === 'IN_PROGRESS') {
            alert(`The exam "${examTitle}" is already marked as 'In Progress'. Resuming your session...`);
            if (onStartExam) onStartExam(examId);
            return;
        }
        if (currentLocalAttemptStatus === 'SUBMITTED') {
            alert(`You have already submitted the exam "${examTitle}".`);
            return;
        }

        if (onStartExam) {
            localStorage.setItem(statusKey, 'IN_PROGRESS');
            setExamAttemptStatuses(prev => ({...prev, [examId.toString()]: 'IN_PROGRESS'}));
            onStartExam(examId);
        }
    };

    const filteredExams = useMemo(() => {
        if (!Array.isArray(examsData)) {
            return [];
        }
        return examsData.filter(exam => {
            if (!exam || typeof exam.title !== 'string') return false;

            const searchTermLower = searchTerm.toLowerCase();
            let matchesSearchTerm = true;
            if (searchTermLower) {
                const titleMatch = exam.title.toLowerCase().includes(searchTermLower);
                const descriptionMatch = typeof exam.description === 'string' && exam.description.toLowerCase().includes(searchTermLower);
                matchesSearchTerm = titleMatch || descriptionMatch;
            }

            const statusMatch = filterStatus ? exam.status === filterStatus : true;

            return matchesSearchTerm && statusMatch;
        });
    }, [examsData, searchTerm, filterStatus]);

    const activeExams = filteredExams.filter(exam => exam.status === 'ACTIVE');
    const upcomingExams = filteredExams.filter(exam => exam.status === 'PUBLISHED');

    const ExamCard = ({ exam, index, type }) => {
        const examIdStr = exam.id.toString();
        const attemptStatus = examAttemptStatuses[examIdStr];

        let isButtonDisabled = type !== 'active';
        let buttonText = type === 'active' ? 'Start Exam' : 'View Details';
        let buttonTitle = type === 'active' ? "Start this exam" : `Exam starts on ${formatDateTime(exam.startDate)}`;
        let cardIcon = type === 'active' ? faPlayCircle : faCalendarCheck;
        let cardIconClass = type === 'active' ? 'accent-color' : 'published-icon';
        let cardExtraClass = '';

        if (attemptStatus === 'IN_PROGRESS') {
            buttonText = 'Resume Exam'; // "Start Exam" yerine "Resume Exam"
            isButtonDisabled = false;
            buttonTitle = "Resume your in-progress exam.";
            cardIcon = faClock;
            cardIconClass = 'in-progress-icon';
            cardExtraClass = 'exam-attempted-card';
        } else if (attemptStatus === 'SUBMITTED') {
            buttonText = 'Submitted';
            isButtonDisabled = true;
            buttonTitle = "You have already submitted this exam.";
            cardIcon = faCheckCircle;
            cardIconClass = 'submitted-icon';
            cardExtraClass = 'exam-attempted-card';
        }

        return (
            <div key={`${type}-${exam.id}-${index}`}
                 className={`widget-card accent-border-left animated-fade-in-up 
                            ${type === 'upcoming' ? 'published-exam-card' : ''} 
                            ${cardExtraClass}
                           `}
                 style={{ animationDelay: `${index * 0.08}s` }}>
                <FontAwesomeIcon icon={cardIcon} className={`widget-icon ${cardIconClass}`} />
                <div className="widget-content">
                    <h4>{exam.title || 'Untitled Exam'}</h4>
                    {exam.description && (
                        <p className='exam-description'>
                            <FontAwesomeIcon icon={faFileLines} />
                            {exam.description}
                        </p>
                    )}
                    <p className='exam-meta'>
                        <span><FontAwesomeIcon icon={faClock} /> {exam.durationMinutes != null ? `${exam.durationMinutes} min` : 'N/A'}</span>
                        <span> | </span>
                        {type === 'active' ? (
                            <span><FontAwesomeIcon icon={faCalendarCheck}/> Ends: {formatDateTime(exam.endDate) || 'No Limit'}</span>
                        ) : (
                            <span><FontAwesomeIcon icon={faHourglassStart}/> Starts: {formatDateTime(exam.startDate)}</span>
                        )}
                    </p>
                    <div style={{marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px'}}>
                        {renderStatusChip(exam.status)}
                        {attemptStatus && (
                            <span className={`status-chip attempt-status-${attemptStatus.toLowerCase()}`}>
                                {attemptStatus === 'IN_PROGRESS' ? 'Attempted' : attemptStatus}
                            </span>
                        )}
                    </div>
                    <button
                        className="widget-button primary start-exam-button"
                        onClick={() => handleStartExamClick(exam.id, exam.title)}
                        disabled={isButtonDisabled && attemptStatus !== 'IN_PROGRESS'}
                        title={buttonTitle}
                    >
                        {buttonText}
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="student-exams-page animated-fade-in-up">
            <div className="filter-bar student-filter-bar">
                <div className="search-input-group">
                    <FontAwesomeIcon icon={faSearch} className="search-icon" />
                    <input
                        type="text"
                        className="input-field"
                        placeholder="Search exams by title or description..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filter-controls">
                    <div className="select-group">
                        <FontAwesomeIcon icon={faFilter} className="filter-icon"/>
                        <select
                            className="filter-select input-field"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="">All General Statuses</option>
                            <option value="ACTIVE">Available Now</option>
                            <option value="PUBLISHED">Upcoming</option>
                        </select>
                    </div>
                </div>
            </div>

            {examsData.length > 0 && filteredExams.length === 0 && (searchTerm || filterStatus) && (
                <p className="no-items-message widget-card">
                    <FontAwesomeIcon icon={faInfoCircle} style={{marginRight: '8px'}} />
                    No exams match your current search/filter criteria.
                </p>
            )}

            {(filterStatus === '' || filterStatus === 'ACTIVE') && (
                <>
                    <h4 className="content-section-title">Available Now ({activeExams.length})</h4>
                    {activeExams.length > 0 ? (
                        <div className="widgets-container exams-section">
                            {activeExams.map((exam, index) => (
                                <ExamCard exam={exam} index={index} type="active" key={`active-${exam.id}-${index}`} />
                            ))}
                        </div>
                    ) : (
                        examsData.length > 0 && !(filteredExams.length === 0 && (searchTerm || filterStatus)) && (
                            <p className="no-items-message widget-card">
                                <FontAwesomeIcon icon={faInfoCircle} style={{marginRight: '8px'}} />
                                No exams currently "Available Now"{(searchTerm || filterStatus === 'ACTIVE') ? ' matching your criteria' : ''}.
                            </p>
                        )
                    )}
                </>
            )}

            {(filterStatus === '' || filterStatus === 'PUBLISHED') && (
                <>
                    <h4 className="content-section-title upcoming-title">Upcoming Exams ({upcomingExams.length})</h4>
                    {upcomingExams.length > 0 ? (
                        <div className="widgets-container exams-section">
                            {upcomingExams.map((exam, index) => (
                                <ExamCard exam={exam} index={index} type="upcoming" key={`upcoming-${exam.id}-${index}`} />
                            ))}
                        </div>
                    ) : (
                        examsData.length > 0 && !(filteredExams.length === 0 && (searchTerm || filterStatus)) && (
                            <p className="no-items-message widget-card">
                                <FontAwesomeIcon icon={faInfoCircle} style={{marginRight: '8px'}} />
                                No "Upcoming Exams" scheduled{(searchTerm || filterStatus === 'PUBLISHED') ? ' matching your criteria' : ''}.
                            </p>
                        )
                    )}
                </>
            )}

            {examsData.length === 0 && (
                <p className="no-items-message widget-card" style={{marginTop: '30px'}}>
                    <FontAwesomeIcon icon={faInfoCircle} style={{marginRight: '8px'}} />
                    No exams have been assigned to you yet. Please check back later.
                </p>
            )}

            <style jsx>{`
                .exams-section { margin-bottom: 30px; }
                .upcoming-title { margin-top: 40px; color: var(--text-medium); }
                .status-chip { /* App.css'den gelir */ }
                .status-published { background-color: rgba(59, 130, 246, 0.1); color: #60a5fa; }
                .status-active { background-color: rgba(52, 211, 153, 0.1); color: var(--student-accent); }
                .status-other { background-color: rgba(148, 163, 184, 0.15); color: var(--text-medium); }
                .attempt-status-in_progress { background-color: rgba(250, 176, 5, 0.2); color: #fab005; border: 1px solid #fab005; }
                .attempt-status-submitted { background-color: rgba(100, 116, 139, 0.2); color: #94a3b8; border: 1px solid #94a3b8;}
                .start-exam-button:disabled {
                    background-color: #334155 !important;
                    border-color: #475569 !important;
                    color: #64748b !important;
                    cursor: not-allowed;
                    box-shadow: none;
                    transform: none;
                }
                .exam-attempted-card {
                    opacity: 0.85;
                }
                .exam-attempted-card .widget-icon.in-progress-icon { color: #fab005; }
                .exam-attempted-card .widget-icon.submitted-icon { color: #94a3b8; }

                .published-exam-card { border-left-color: #60a5fa; }
                .published-icon { color: #60a5fa; }
                .exam-description {
                    font-size: 0.88rem;
                    color: var(--text-medium);
                    line-height: 1.5;
                    margin-top: -5px;
                    margin-bottom: 12px;
                    padding-left: 5px;
                    max-height: 4.5em;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    display: -webkit-box;
                    -webkit-line-clamp: 3;
                    -webkit-box-orient: vertical;
                }
                .exam-description svg { margin-right: 7px; opacity: 0.7; }
                .exam-meta {
                    font-size: 0.8rem !important;
                    color: var(--text-medium) !important;
                    margin-bottom: 15px !important;
                    display: flex;
                    flex-wrap: wrap;
                    gap: 5px 10px;
                    align-items: center;
                }
                .exam-meta svg { margin-right: 4px; }
                .no-items-message {
                    padding: 25px;
                    text-align: center;
                    font-style: normal;
                    color: var(--text-medium);
                    background-color: var(--card-bg);
                    border: 1px solid var(--border-light);
                    border-radius: var(--border-radius-md);
                    margin: 10px 0;
                }
                .no-items-message svg {
                    margin-right: 8px;
                    color: var(--text-medium);
                }

                .student-filter-bar {
                    margin-bottom: 25px;
                    padding: 20px 25px;
                    display: flex;
                    flex-wrap: wrap;
                    gap: 15px 20px;
                    align-items: center;
                    background-color: var(--card-bg);
                    border: 1px solid var(--border-light);
                    border-radius: var(--border-radius-md);
                    box-shadow: 0 6px 20px rgba(0,0,0,.25);
                }
                .student-filter-bar .search-input-group {
                    position: relative;
                    flex-grow: 1;
                    min-width: 250px;
                }
                .student-filter-bar .search-icon {
                    position: absolute;
                    left: 15px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: var(--text-medium);
                    opacity: 0.6;
                }
                .student-filter-bar .input-field {
                    padding-left: 45px;
                    font-size: 0.9rem;
                    background-color: var(--input-bg);
                    border: 1px solid var(--border-light);
                    color: var(--text-light);
                    border-radius: var(--border-radius-sm);
                    width: 100%;
                    box-sizing: border-box;
                }
                .student-filter-bar .input-field:focus {
                    border-color: var(--accent-primary);
                    background-color: var(--input-bg-focus);
                    box-shadow: 0 0 0 2px var(--accent-primary-glow);
                }
                .student-filter-bar .filter-controls {
                    display: flex;
                    gap: 15px;
                    flex-wrap: wrap;
                }
                .student-filter-bar .select-group {
                    position: relative;
                    min-width: 180px;
                }
                .student-filter-bar .filter-icon {
                    position: absolute;
                    left: 15px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: var(--text-medium);
                    opacity: 0.6;
                    pointer-events: none;
                }
                .student-filter-bar .filter-select {
                    padding-left: 45px;
                    font-size: 0.85rem;
                    width: 100%;
                    box-sizing: border-box;
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='%2394a3b8' viewBox='0 0 20 20'%3E%3Cpath d='M10 14l-5-5h10z'/%3E%3C/svg%3E");
                    background-repeat: no-repeat;
                    background-position: right 12px center;
                    background-size: 10px;
                    appearance: none;
                    -webkit-appearance: none;
                    -moz-appearance: none;
                }
                .student-filter-bar .filter-select:focus {
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='%230ea5e9' viewBox='0 0 20 20'%3E%3Cpath d='M10 14l-5-5h10z'/%3E%3C/svg%3E");
                }
                @media (max-width: 768px) {
                    .student-filter-bar {
                        flex-direction: column;
                        align-items: stretch;
                    }
                    .student-filter-bar .search-input-group {
                        min-width: unset;
                        width: 100%;
                    }
                    .student-filter-bar .filter-controls {
                        width: 100%;
                        justify-content: space-between;
                    }
                    .student-filter-bar .select-group {
                        min-width: calc(50% - 8px);
                        flex-grow: 1;
                    }
                }
            `}</style>
        </div>
    );
}

export default StudentExamsPage;
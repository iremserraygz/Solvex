// src/components/StudentExamsPage.js
import React from 'react';
import '../App.css'; // Global stiller
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlayCircle, faClock, faCalendarCheck, faHourglassStart, faExclamationTriangle, faInfoCircle } from '@fortawesome/free-solid-svg-icons'; // Added faHourglassStart

function StudentExamsPage({ examsData = [], onStartExam }) { // Default examsData to empty array

    // Helper functions (remain mostly the same)
    const formatDateTime = (isoString) => {
        // ... (same as before) ...
        if (!isoString) return 'N/A';
        try {
            const date = new Date(isoString);
            if (isNaN(date.getTime())) { return "Invalid Date"; }
            return date.toLocaleString(navigator.language || 'en-US', {
                year: 'numeric', month: 'short', day: 'numeric',
                hour: '2-digit', minute: '2-digit', hour12: false
            });
        } catch (e) {
            console.error("Error formatting date:", isoString, e);
            return "Format Error";
        }
    };

    // --- MODIFIED: renderStatusChip for Available/Upcoming ---
    const renderStatusChip = (status) => {
        let chipClass = 'status-chip ';
        let icon = faInfoCircle; // Default icon
        let displayStatus = status || "Unknown";

        switch (status?.toUpperCase()) {
            case 'PUBLISHED': // Means upcoming
                chipClass += 'status-published'; // Use CSS class for styling
                icon = faHourglassStart; // Icon for upcoming
                displayStatus = "Upcoming";
                break;
            case 'ACTIVE': // Means ready and start date has passed
                chipClass += 'status-active';
                icon = faPlayCircle;
                displayStatus = "Available Now";
                break;
            // ENDED status shouldn't appear here based on backend logic
            default:
                chipClass += 'status-other';
        }
        return (
            <span className={chipClass}>
                <FontAwesomeIcon icon={icon} style={{ marginRight: '6px', fontSize: '0.9em' }}/>
                {displayStatus}
            </span>
        );
    };
    // --- --- ---

    // Handler for starting exam
    const handleStartExam = (examId) => {
        if (onStartExam) {
            onStartExam(examId);
        } else {
            console.error("[StudentExamsPage] 'onStartExam' prop function is missing!");
        }
    }

    // --- NEW: Separate exams into active and upcoming ---
    const activeExams = examsData.filter(exam => exam.status === 'ACTIVE');
    const upcomingExams = examsData.filter(exam => exam.status === 'PUBLISHED');
    // --- --- ---

    return (
        <div className="student-exams-page animated-fade-in-up">

            {/* Section for Exams Available Now */}
            <h4 className="content-section-title">Available Now</h4>
            <div className="widgets-container exams-section">
                {activeExams.length === 0 ? (
                    <p className="no-items-message widget-card">No exams currently available to start.</p>
                ) : (
                    activeExams.map((exam, index) => (
                        <div key={`active-${exam.id}`} className="widget-card accent-border-left animated-fade-in-up" style={{ animationDelay: `${index * 0.08}s` }}>
                            <FontAwesomeIcon icon={faPlayCircle} className="widget-icon accent-color" />
                            <div className="widget-content">
                                <h4>{exam.title || 'Untitled Exam'}</h4>
                                <p className='exam-meta'>
                                    <span><FontAwesomeIcon icon={faClock} /> {exam.durationMinutes != null ? `${exam.durationMinutes} min` : 'N/A'}</span>
                                    <span> | </span>
                                    {/* Show end date prominently if available */}
                                    <span><FontAwesomeIcon icon={faCalendarCheck}/> Ends: {formatDateTime(exam.endDate) || 'No Limit'}</span>
                                </p>
                                <p>Status: {renderStatusChip(exam.status)}</p>
                                <button
                                    className="widget-button primary start-exam-button" // Added specific class
                                    onClick={() => handleStartExam(exam.id)}
                                    // Should always be enabled if status is ACTIVE
                                    // disabled={exam.status?.toUpperCase() !== 'ACTIVE'}
                                    title="Start this exam"
                                >
                                    Start Exam
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* --- NEW: Section for Upcoming Exams --- */}
            <h4 className="content-section-title upcoming-title">Upcoming Exams</h4>
            <div className="widgets-container exams-section">
                {upcomingExams.length === 0 ? (
                    <p className="no-items-message widget-card">No upcoming exams scheduled.</p>
                ) : (
                    upcomingExams.map((exam, index) => (
                        <div key={`upcoming-${exam.id}`} className="widget-card accent-border-left published-exam-card animated-fade-in-up" style={{ animationDelay: `${index * 0.08}s` }}>
                            {/* Different icon maybe? */}
                            <FontAwesomeIcon icon={faCalendarCheck} className="widget-icon published-icon" />
                            <div className="widget-content">
                                <h4>{exam.title || 'Untitled Exam'}</h4>
                                <p className='exam-meta'>
                                    <span><FontAwesomeIcon icon={faClock} /> {exam.durationMinutes != null ? `${exam.durationMinutes} min` : 'N/A'}</span>
                                    <span> | </span>
                                    {/* Show start date prominently */}
                                    <span><FontAwesomeIcon icon={faHourglassStart}/> Starts: {formatDateTime(exam.startDate)}</span>
                                </p>
                                <p>Status: {renderStatusChip(exam.status)}</p>
                                {/* Button is disabled for upcoming exams */}
                                <button
                                    className="widget-button primary start-exam-button"
                                    disabled={true}
                                    title={`Exam starts on ${formatDateTime(exam.startDate)}`}
                                >
                                    Starts Soon
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
            {/* --- --- --- */}

            <style jsx>{`
                .exams-section {
                    margin-bottom: 30px; /* Space between sections */
                }
                .upcoming-title {
                    margin-top: 40px; /* More space before upcoming */
                    color: var(--text-medium); /* Dim the title slightly */
                }
                .no-items-message { /* Styles from App.css or previous */ }
                .status-chip { /* Styles from App.css or previous */ }
                .status-published { background-color: rgba(59, 130, 246, 0.1); color: #60a5fa; }
                .status-active { background-color: rgba(52, 211, 153, 0.1); color: var(--student-accent); }
                .status-other { background-color: rgba(148, 163, 184, 0.15); color: var(--text-medium); }
                .start-exam-button:disabled {
                    background-color: #334155 !important; /* Override primary */
                    border-color: #475569 !important;
                    color: #64748b !important;
                    cursor: not-allowed;
                    box-shadow: none;
                    transform: none;
                }
                .published-exam-card {
                    border-left-color: #60a5fa; /* Match published status color */
                }
                .published-icon {
                    color: #60a5fa; /* Match published status color */
                }
            `}</style>
        </div>
    );
}

export default StudentExamsPage;
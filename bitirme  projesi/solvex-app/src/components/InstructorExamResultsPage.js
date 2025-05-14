// src/components/InstructorExamResultsPage.js
import React from 'react';
import '../App.css'; // Global CSS
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faChevronLeft, faUser, faPercentage, faChartBar, faTrophy,
    faInfoCircle, faClipboardList, faCalendarCheck, faCheckCircle, faTimesCircle,
    faEye // Göz ikonu
} from '@fortawesome/free-solid-svg-icons';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function InstructorExamResultsPage({ examResults, onBackToExams, onViewStudentSubmission }) {

    if (!examResults || Object.keys(examResults).length === 0) {
        return (
            <div className="view-exams-page animated-fade-in-up">
                 <div className="page-header-actions">
                     <button onClick={onBackToExams} className="back-button-page">
                        <FontAwesomeIcon icon={faChevronLeft} /> Back to Manage Exams
                    </button>
                </div>
                <div className="error-message-container widget-card">
                    <FontAwesomeIcon icon={faInfoCircle} size="2x" style={{ color: 'var(--text-medium)', marginBottom: '15px' }} />
                    <h4>No Results Available</h4>
                    <p style={{ color: 'var(--text-medium)' }}>Could not load or find results for this exam.</p>
                </div>
            </div>
        );
    }

    const {
        quizTitle = "Exam Results",
        totalParticipants = 0,
        averageScorePercentage, // Artık bu bir sayı (double) veya null olabilir
        passingScore,
        scoreDistribution = [],
        studentResults = []
    } = examResults;

    const chartData = {
        labels: scoreDistribution.length > 0 ? scoreDistribution.map(item => item.label) : ['No Data'],
        datasets: [
            {
                label: 'Number of Students',
                data: scoreDistribution.length > 0 ? scoreDistribution.map(item => item.value) : [0],
                backgroundColor: 'rgba(14, 165, 233, 0.6)',
                borderColor: 'rgba(14, 165, 233, 1)',
                borderWidth: 1, borderRadius: 4,
                hoverBackgroundColor: 'rgba(14, 165, 233, 0.8)',
                hoverBorderColor: 'rgba(14, 165, 233, 1)',
            },
        ],
    };

    const chartOptions = {
        responsive: true, maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            title: { display: true, text: 'Score Distribution', color: 'var(--text-medium)', font: { size: 16, family: 'Poppins' } },
            tooltip: { backgroundColor: 'rgba(15, 23, 42, 0.9)', titleFont: { family: 'Poppins', size: 14 }, bodyFont: { family: 'Poppins', size: 12 }, padding: 10, cornerRadius: 4, }
        },
        scales: {
            y: { beginAtZero: true, ticks: { color: 'var(--text-medium)', font: { family: 'Poppins', size: 10 }, stepSize: 1, precision: 0 }, grid: { color: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' } },
            x: { ticks: { color: 'var(--text-medium)', font: { family: 'Poppins', size: 11 } }, grid: { display: false, borderColor: 'rgba(255, 255, 255, 0.1)' } }
        }
    };

    const formatSubmissionDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return "Invalid Date";
            return date.toLocaleString(navigator.language || 'en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'});
        } catch (e) { return 'Format Error'; }
    };

    const renderStudentStatusChip = (status) => {
        if (!status) return <span className="status-chip status-other">-</span>;
        let statusClass = 'status-chip ';
        let icon = null;
        let displayStatus = status;
        switch (status.toUpperCase()) {
            case 'PASSED': statusClass += 'status-passed'; icon = faCheckCircle; break;
            case 'FAILED': statusClass += 'status-failed'; icon = faTimesCircle; break;
            case 'COMPLETED': statusClass += 'status-completed'; icon = faClipboardList; break;
            default: statusClass += 'status-other'; icon = faInfoCircle;
        }
        return (<span className={statusClass} title={displayStatus}>{icon && <FontAwesomeIcon icon={icon} style={{ marginRight: '5px' }} />} {displayStatus}</span>);
    };

    // Ortalama skoru formatla
    const formattedAvgScore = averageScorePercentage != null ? `${parseFloat(averageScorePercentage).toFixed(1)}%` : 'N/A';

    return (
        <div className="instructor-exam-results-page animated-fade-in-up">
            <div className="page-header-actions">
                <button onClick={onBackToExams} className="back-button-page">
                    <FontAwesomeIcon icon={faChevronLeft} /> Back to Manage Exams
                </button>
            </div>

             <div className="widget-card exam-summary-card" style={{ marginBottom: '30px' }}>
                <h3><FontAwesomeIcon icon={faChartBar} style={{ marginRight: '10px' }} />Results for: {quizTitle}</h3>
                <div className="summary-details">
                    <div className="summary-item">
                         <FontAwesomeIcon icon={faUser} />
                        <span>{totalParticipants}</span>
                        Participants
                    </div>
                    <div className="summary-item">
                         <FontAwesomeIcon icon={faPercentage} />
                        <span>{formattedAvgScore}</span> {/* FORMATLANMIŞ DEĞER */}
                        Avg. Score
                    </div>
                    <div className="summary-item">
                        <FontAwesomeIcon icon={faTrophy} />
                        <span>{passingScore != null ? `${passingScore}%` : 'N/A'}</span>
                        Passing Score
                    </div>
                </div>
            </div>

            {scoreDistribution.length > 0 && (
                 <div className="widget-card result-section chart-section" style={{ marginBottom: '30px' }}>
                    <h4>Score Distribution</h4>
                    <div className="chart-container">
                        <Bar options={chartOptions} data={chartData} />
                     </div>
                </div>
            )}

            {studentResults.length > 0 ? (
                <div className="widget-card result-section">
                    <h4><FontAwesomeIcon icon={faClipboardList} /> Student Submissions ({studentResults.length})</h4>
                    <div className="student-results-table-container">
                        <table className="student-results-table">
                             <thead>
                                <tr>
                                    {/* Student ID yerine Student Name */}
                                    <th>Student Name</th>
                                    <th>Submitted At</th>
                                    <th>Score</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                 {studentResults.map((student, index) => (
                                    <tr key={student.submissionId || student.userId || index}>
                                        {/* student.studentFirstName ve student.studentLastName kullan */}
                                        <td data-label="Student Name">
                                            {student.studentFirstName && student.studentLastName
                                                ? `${student.studentFirstName} ${student.studentLastName}`
                                                : student.studentFirstName || student.studentLastName || `User ID: ${student.userId}` /* Fallback */}
                                        </td>
                                        <td data-label="Submitted At">{formatSubmissionDate(student.submissionDate)}</td>
                                        <td data-label="Score">
                                             {student.achievedPoints != null ? student.achievedPoints : '-'} / {student.totalPossiblePoints != null ? student.totalPossiblePoints : '-'}
                                             {student.totalPossiblePoints != null && student.totalPossiblePoints > 0 && student.achievedPoints != null &&
                                                ` (${((student.achievedPoints / student.totalPossiblePoints) * 100).toFixed(1)}%)`
                                             }
                                        </td>
                                        <td data-label="Status">{renderStudentStatusChip(student.status)}</td>
                                        <td data-label="Actions">
                                            <button
                                                className="action-btn review-submission-btn"
                                                title="View Student's Submission"
                                                onClick={() => onViewStudentSubmission(student.submissionId)}
                                                disabled={!student.submissionId}
                                            >
                                                <FontAwesomeIcon icon={faEye} /> Review
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                         </table>
                    </div>
                </div>
            ) : (
                <div className="widget-card result-section">
                    <p style={{ textAlign: 'center', color: 'var(--text-medium)', padding: '20px' }}>
                        <FontAwesomeIcon icon={faInfoCircle} style={{ marginRight: '8px' }} />
                        No individual student submissions to display for this exam yet.
                    </p>
                </div>
             )}
        </div>
    );
}

export default InstructorExamResultsPage;
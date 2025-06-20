import React from 'react';
import '../App.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faTimes, faUser, faPercentage, faChartBar, faTrophy,
    faInfoCircle, faClipboardList, faCalendarCheck, faCheckCircle, faTimesCircle
} from '@fortawesome/free-solid-svg-icons';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function ExamResultModal({ onClose, examDetails }) {
    if (!examDetails) {
        return (
            <div className="modal-overlay large-modal-overlay" onClick={onClose}>
                <div className="modal-content large-modal" onClick={e => e.stopPropagation()}>
                    <div className="modal-header">
                        <h3><FontAwesomeIcon icon={faChartBar} /> Exam Results</h3>
                        <button onClick={onClose} className="modal-close-button"><FontAwesomeIcon icon={faTimes} /></button>
                    </div>
                    <div className="modal-body result-modal-body">
                        <p style={{ textAlign: 'center', color: 'var(--text-medium)' }}>
                            <FontAwesomeIcon icon={faInfoCircle} style={{ marginRight: '8px' }} />
                            No exam details available to display.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const {
        quizTitle = "Exam",
        totalParticipants = 0,
        averageScorePercentage,
        passingScore,
        scoreDistribution = [],
        studentResults = []
    } = examDetails;

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
            return date.toLocaleString(navigator.language || 'en-US', {
                year: 'numeric', month: 'short', day: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
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
        return (
            <span className={statusClass} title={displayStatus}>
                {icon && <FontAwesomeIcon icon={icon} style={{ marginRight: '5px' }} />}
                {displayStatus}
            </span>
        );
    };

    return (
        <div className="modal-overlay large-modal-overlay" onClick={onClose}>
            <div className="modal-content large-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3><FontAwesomeIcon icon={faChartBar} /> Exam Results: {quizTitle}</h3>
                    <button onClick={onClose} className="modal-close-button"><FontAwesomeIcon icon={faTimes} /></button>
                </div>
                <div className="modal-body result-modal-body">
                    <div className="result-summary">
                        <div className="summary-item">
                            <FontAwesomeIcon icon={faUser} />
                            <span>{totalParticipants}</span>
                            Participants
                        </div>
                        <div className="summary-item">
                            <FontAwesomeIcon icon={faPercentage} />
                            <span>{averageScorePercentage != null ? `${averageScorePercentage}%` : 'N/A'}</span>
                            Avg. Score
                        </div>
                        <div className="summary-item">
                            <FontAwesomeIcon icon={faTrophy} />
                            <span>{passingScore != null ? `${passingScore}%` : 'N/A'}</span>
                            Passing Score
                        </div>
                    </div>

                    {scoreDistribution.length > 0 && (
                        <div className="result-section chart-section">
                            <h4>Score Distribution</h4>
                            <div className="chart-container">
                                <Bar options={chartOptions} data={chartData} />
                            </div>
                        </div>
                    )}

                    {studentResults.length > 0 ? (
                        <div className="result-section">
                            <h4><FontAwesomeIcon icon={faClipboardList} /> Student Submissions ({studentResults.length})</h4>
                            <div className="student-results-table-container">
                                <table className="student-results-table">
                                    <thead>
                                        <tr>
                                            <th>Student ID</th>
                                            <th>Submitted At</th>
                                            <th>Score</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {studentResults.map((student, index) => (
                                            <tr key={student.submissionId || student.userId || index}>
                                                <td>{student.studentIdentifier || `User ${student.userId}`}</td>
                                                <td>{formatSubmissionDate(student.submissionDate)}</td>
                                                <td>
                                                    {student.achievedPoints ?? '-'} / {student.totalPossiblePoints ?? '-'}
                                                </td>
                                                <td>{renderStudentStatusChip(student.status)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="result-section">
                             <p style={{textAlign: 'center', color: 'var(--text-medium)', marginTop: '20px'}}>
                                <FontAwesomeIcon icon={faInfoCircle} style={{marginRight: '8px'}} />
                                No individual student submissions to display for this exam yet.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
export default ExamResultModal;
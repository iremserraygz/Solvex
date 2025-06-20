// src/components/ExamHistoryPage.js
import React, { useMemo, useState } from 'react';
import '../App.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faHistory, faCalendarAlt, faEye, faClock, faListAlt,
    faSortAmountDown, faSortAmountUp, faCheckCircle, faTimesCircle, faStar,
    faTrophy, faChartBar, faUsers, faEdit, faPercentage,
    faMinusCircle // Icon for Not Attempted
} from '@fortawesome/free-solid-svg-icons';

function ExamHistoryPage({ role = 'student', historyData = [], onViewDetails }) {

    const [sortConfig, setSortConfig] = useState({ key: 'dateTaken', direction: 'descending' });

    const sortedHistory = useMemo(() => {
        const dataToSort = Array.isArray(historyData) ? [...historyData] : [];
        if (dataToSort.length === 0 || sortConfig.key === null) return dataToSort;

        dataToSort.sort((a, b) => {
            let aValue = a?.[sortConfig.key];
            let bValue = b?.[sortConfig.key];

            if (sortConfig.key === 'dateTaken' || sortConfig.key === 'dateCompleted') {
                aValue = aValue ? new Date(aValue).getTime() : 0;
                bValue = bValue ? new Date(bValue).getTime() : 0;
            }
            else if (['score', 'durationMinutes', 'totalPoints', 'participants', 'avgScore'].includes(sortConfig.key)) {
                aValue = typeof aValue === 'number' ? aValue : -Infinity;
                bValue = typeof bValue === 'number' ? bValue : -Infinity;
            }
            else {
                aValue = String(aValue ?? '').toLowerCase();
                bValue = String(bValue ?? '').toLowerCase();
            }

            if (aValue < bValue) return -1;
            if (aValue > bValue) return 1;
            return 0;
        });


        if (sortConfig.direction === 'descending') {
            dataToSort.reverse();
        }
        return dataToSort;
    }, [historyData, sortConfig]);

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return null;
        return sortConfig.direction === 'ascending' ? faSortAmountUp : faSortAmountDown;
    };

    const handleViewDetailsClick = (id) => {
        console.log('[ExamHistoryPage] handleViewDetailsClick triggered for ID:', id);
        if (onViewDetails) {
            onViewDetails(id);
        } else {
            console.error("[ExamHistoryPage] onViewDetails prop function is missing!");
            alert("Cannot view review details.");
        }
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return '-';
        try {
            const dateObj = new Date(dateString);
            if (isNaN(dateObj.getTime())) return 'Invalid Date';
            return dateObj.toLocaleString(navigator.language || 'en-US', {
                day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false
            });
        } catch (e) { return 'Format Error'; }
    };

    const renderStudentStatusChip = (status) => {
        if (!status) return <span className="status-chip status-other">-</span>;
        let statusClass = 'status-chip ';
        let icon = null;
        let displayStatus = status;
        switch (status.toUpperCase()) {
            case 'PASSED': statusClass += 'status-passed'; icon = faTrophy; break;
            case 'FAILED': statusClass += 'status-failed'; icon = faTimesCircle; break;
            case 'NOT_ATTEMPTED': statusClass += 'status-not-attempted'; icon = faMinusCircle; displayStatus = 'Not Attempted'; break;
            case 'COMPLETED': statusClass += 'status-completed'; icon = faCheckCircle; break;
            default: statusClass += 'status-other'; icon = faHistory;
        }
        return (
            <span className={statusClass} title={displayStatus}>
                 {icon && <FontAwesomeIcon icon={icon} style={{ marginRight: '5px' }}/>}
                {displayStatus}
             </span>
        );
    };

    const renderInstructorExamStatusChip = (status) => {
        if (!status) return <span className="status-chip status-other">-</span>;
        let statusClass = 'status-chip ';
        let icon = null;
        switch (status.toUpperCase()) {
            case 'DRAFT': statusClass += 'status-draft'; icon = faEdit; break;
            case 'PUBLISHED': statusClass += 'status-published'; icon = faCalendarAlt; break;
            case 'ACTIVE': statusClass += 'status-active'; icon = faClock; break;
            case 'ENDED': statusClass += 'status-ended'; icon = faCheckCircle; break;
            default: statusClass += 'status-other'; icon = faHistory;
        }
        return (
            <span className={statusClass} title={status}>
                {icon && <FontAwesomeIcon icon={icon} style={{ marginRight: '5px' }} />}
                {status}
            </span>
        );
    };

    return (
        <div className="exam-history-page animated-fade-in-up">
            <div className="history-list widget-card">
                <div className="list-table-container">
                    <table className="history-table">
                        <thead>
                        <tr>
                            {role === 'student' && (
                                <>
                                    <th onClick={() => requestSort('title')}><FontAwesomeIcon icon={faListAlt} /> Exam Title {getSortIcon('title') && <FontAwesomeIcon icon={getSortIcon('title')} />}</th>
                                    <th onClick={() => requestSort('dateTaken')}><FontAwesomeIcon icon={faCalendarAlt} /> Date {getSortIcon('dateTaken') && <FontAwesomeIcon icon={getSortIcon('dateTaken')} />}</th>
                                    <th onClick={() => requestSort('score')}><FontAwesomeIcon icon={faStar} /> Score {getSortIcon('score') && <FontAwesomeIcon icon={getSortIcon('score')} />}</th>
                                    <th onClick={() => requestSort('studentStatus')}><FontAwesomeIcon icon={faHistory} /> Status {getSortIcon('studentStatus') && <FontAwesomeIcon icon={getSortIcon('studentStatus')} />}</th>
                                    <th onClick={() => requestSort('durationMinutes')}><FontAwesomeIcon icon={faClock} /> Duration {getSortIcon('durationMinutes') && <FontAwesomeIcon icon={getSortIcon('durationMinutes')} />}</th>
                                    <th>Actions</th>
                                </>
                            )}
                            {/* --- CORRECTED: Replaced comment with actual JSX for instructor headers --- */}
                            {role === 'instructor' && (
                                <>
                                    <th onClick={() => requestSort('title')}><FontAwesomeIcon icon={faListAlt} /> Exam Title {getSortIcon('title') && <FontAwesomeIcon icon={getSortIcon('title')} />}</th>
                                    <th onClick={() => requestSort('dateCompleted')}><FontAwesomeIcon icon={faCalendarAlt} /> Date Ended {getSortIcon('dateCompleted') && <FontAwesomeIcon icon={getSortIcon('dateCompleted')} />}</th>
                                    <th onClick={() => requestSort('participants')}><FontAwesomeIcon icon={faUsers} /> Participants {getSortIcon('participants') && <FontAwesomeIcon icon={getSortIcon('participants')} />}</th>
                                    <th onClick={() => requestSort('avgScore')}><FontAwesomeIcon icon={faPercentage} /> Avg. Score {getSortIcon('avgScore') && <FontAwesomeIcon icon={getSortIcon('avgScore')} />}</th>
                                    {/* If you want to show the general status of the quiz (DRAFT, PUBLISHED, ENDED) for the instructor */}
                                    {/* <th onClick={() => requestSort('status')}><FontAwesomeIcon icon={faHistory} /> Quiz Status {getSortIcon('status') && <FontAwesomeIcon icon={getSortIcon('status')} />}</th> */}
                                    <th>Actions</th>
                                </>
                            )}
                            {/* --- END CORRECTION --- */}
                        </tr>
                        </thead>
                        <tbody>
                        {sortedHistory.length === 0 ? (
                            <tr><td colSpan={role === 'student' ? 6 : (role === 'instructor' ? 5 : 5)} style={{ textAlign: 'center', padding: '30px', fontStyle: 'italic' }}>No exam history found.</td></tr>
                        ) : (
                            sortedHistory.map(item => {
                                const submissionId = item?.submissionId;
                                const studentStatusFromDto = item?.studentStatus;
                                const reviewAvailable = !!submissionId && (item?.reviewAvailable !== false);

                                const examIdForInstructor = item?.id || item?.examId;
                                const title = item?.title ?? 'N/A';
                                const dateToDisplay = role === 'student' ? item?.dateTaken : item?.dateCompleted;
                                const score = item?.score;
                                const totalPoints = item?.totalPoints;
                                const duration = item?.durationMinutes;
                                const participants = item?.participants;
                                const avgScore = item?.avgScore;
                                // const instructorExamStatus = item?.status; // General status of the quiz

                                return (
                                    <tr key={submissionId || `history-${examIdForInstructor}`}>
                                        {role === 'student' && (
                                            <>
                                                <td>{title}</td>
                                                <td>{formatDateTime(dateToDisplay)}</td>
                                                <td>
                                                    {score != null ? score : (studentStatusFromDto === 'NOT_ATTEMPTED' || studentStatusFromDto === 'FAILED') ? '0' : '-'}
                                                    {totalPoints != null ? ` / ${totalPoints}` : (studentStatusFromDto === 'NOT_ATTEMPTED' ? ' / N/A' : '')}
                                                </td>
                                                <td>{renderStudentStatusChip(studentStatusFromDto)}</td>
                                                <td>{duration != null ? `${duration} min` : '-'}</td>
                                                <td>
                                                    {submissionId ? (
                                                        <button
                                                            className="action-btn details-btn"
                                                            title={reviewAvailable ? "View Review" : "Review Not Available"}
                                                            onClick={() => handleViewDetailsClick(submissionId)}
                                                            disabled={!reviewAvailable}
                                                        >
                                                            <FontAwesomeIcon icon={faEye} />
                                                        </button>
                                                    ) : (
                                                        <span className="no-data-message">No submission data</span>
                                                    )}
                                                </td>
                                            </>
                                        )}
                                        {role === 'instructor' && (
                                            <>
                                                <td>{title}</td>
                                                <td>{formatDateTime(dateToDisplay)}</td>
                                                <td>{participants ?? '-'}</td>
                                                <td>{avgScore != null ? `${avgScore}%` : '-'}</td>
                                                {/* <td>{renderInstructorExamStatusChip(instructorExamStatus)}</td> */}
                                                <td>
                                                    <button
                                                        className="action-btn results-btn"
                                                        title="View Detailed Results"
                                                        onClick={() => handleViewDetailsClick(examIdForInstructor)}
                                                    >
                                                        <FontAwesomeIcon icon={faChartBar} />
                                                    </button>
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                );
                            })
                        )}
                        </tbody>
                    </table>
                </div>
            </div>
            <style jsx>{`
                .history-table th svg { margin-right: 6px; }
                .action-btn:disabled { opacity: 0.4; cursor: not-allowed; }
                .status-chip { padding: 4px 10px; border-radius: var(--border-radius-sm); font-size: 0.75rem; font-weight: 600; text-transform: uppercase; display: inline-flex; align-items: center; gap: 5px; }
                .status-completed { background-color: rgba(100, 116, 139, 0.2); color: #94a3b8; }
                .status-passed { background-color: rgba(52, 211, 153, 0.15); color: #34d399; }
                .status-failed { background-color: var(--error-bg); color: var(--error-color); }
                .status-not-attempted {
                    background-color: rgba(100, 116, 139, 0.15); /* Example: slightly different grey */
                    color: var(--text-medium);
                }
                .status-other { background-color: rgba(255, 255, 255, 0.1); color: var(--text-medium); }

                /* Instructor general exam statuses (if you uncomment the column) */
                .status-draft { background-color: rgba(148, 163, 184, 0.15); color: var(--text-medium); }
                .status-published { background-color: rgba(59, 130, 246, 0.1); color: #60a5fa; }
                .status-active { background-color: rgba(234, 179, 8, 0.15); color: #facc15; }
                .status-ended { background-color: rgba(100, 116, 139, 0.2); color: #94a3b8; }

                .no-data-message {
                    font-size: 0.85em;
                    color: var(--text-medium);
                    font-style: italic;
                }
            `}</style>
        </div>
    );
}

export default ExamHistoryPage;
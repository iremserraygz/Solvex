import React, { useMemo, useState } from 'react';
import '../App.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faHistory, faCalendarAlt, faEye, faClock, faListAlt,
    faSortAmountDown, faSortAmountUp, faCheckCircle, faTimesCircle, faStar,
    faTrophy, faChartBar, faUsers, faEdit, faPercentage,
    faMinusCircle, faSearch, faFilter, faInfoCircle
} from '@fortawesome/free-solid-svg-icons';

function ExamHistoryPage({ role = 'student', historyData = [], onViewDetails }) {

    const [searchTerm, setSearchTerm] = useState('');
    const [filterStudentStatus, setFilterStudentStatus] = useState('');
    const [filterInstructorStatus, setFilterInstructorStatus] = useState('');

    const [sortConfig, setSortConfig] = useState({ key: 'dateTaken', direction: 'descending' });

    const filteredData = useMemo(() => {
        if (!Array.isArray(historyData)) return [];
        return historyData.filter(item => {
            if (!item) return false;

            const searchTermLower = searchTerm.toLowerCase();
            let matchesSearchTerm = true;
            if (searchTermLower) {
                const titleMatch = item.title?.toLowerCase().includes(searchTermLower) || false;
                const descriptionMatch = item.description?.toLowerCase().includes(searchTermLower) || false;
                matchesSearchTerm = titleMatch || descriptionMatch;
            }

            let statusMatch = true;
            if (role === 'student' && filterStudentStatus) {
                statusMatch = item.studentStatus === filterStudentStatus;
            } else if (role === 'instructor' && filterInstructorStatus) {
                statusMatch = item.status === filterInstructorStatus;
            }
            return matchesSearchTerm && statusMatch;
        });
    }, [historyData, searchTerm, filterStudentStatus, filterInstructorStatus, role]);


    const sortedHistory = useMemo(() => {
        const dataToSort = [...filteredData];
        if (dataToSort.length === 0 || sortConfig.key === null) return dataToSort;

        dataToSort.sort((a, b) => {
            let aValue = a?.[sortConfig.key];
            let bValue = b?.[sortConfig.key];

            if (sortConfig.key === 'dateTaken' || sortConfig.key === 'dateCompleted') {
                aValue = aValue ? new Date(aValue).getTime() : 0;
                bValue = bValue ? new Date(bValue).getTime() : 0;
            }
            else if (['score', 'durationMinutes', 'totalPoints', 'participants', 'avgScore'].includes(sortConfig.key)) {
                aValue = typeof aValue === 'number' && !isNaN(aValue) ? aValue : -Infinity;
                bValue = typeof bValue === 'number' && !isNaN(bValue) ? bValue : -Infinity;
            }
            else {
                aValue = String(aValue ?? '').toLowerCase();
                bValue = String(bValue ?? '').toLowerCase();
            }

            if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
            return 0;
        });
        return dataToSort;
    }, [filteredData, sortConfig]);

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
        if (onViewDetails) {
            onViewDetails(id);
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
            <div className="filter-bar history-filter-bar">
                <div className="search-input-group">
                    <FontAwesomeIcon icon={faSearch} className="search-icon" />
                    <input
                        type="text"
                        className="input-field"
                        placeholder="Search by exam title or description..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filter-controls">
                    {role === 'student' && (
                        <div className="select-group">
                            <FontAwesomeIcon icon={faFilter} className="filter-icon"/>
                            <select
                                className="filter-select input-field"
                                value={filterStudentStatus}
                                onChange={(e) => setFilterStudentStatus(e.target.value)}
                            >
                                <option value="">All My Statuses</option>
                                <option value="PASSED">Passed</option>
                                <option value="FAILED">Failed</option>
                                <option value="COMPLETED">Completed</option>
                                <option value="NOT_ATTEMPTED">Not Attempted</option>
                            </select>
                        </div>
                    )}
                    {role === 'instructor' && (
                        <div className="select-group">
                            <FontAwesomeIcon icon={faFilter} className="filter-icon"/>
                            <select
                                className="filter-select input-field"
                                value={filterInstructorStatus}
                                onChange={(e) => setFilterInstructorStatus(e.target.value)}
                            >
                                <option value="">All Exam Statuses</option>
                                <option value="DRAFT">Draft</option>
                                <option value="PUBLISHED">Published</option>
                                <option value="ACTIVE">Active</option>
                                <option value="ENDED">Ended</option>
                            </select>
                        </div>
                    )}
                </div>
            </div>

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
                                    <th onClick={() => requestSort('studentStatus')}><FontAwesomeIcon icon={faHistory} /> My Status {getSortIcon('studentStatus') && <FontAwesomeIcon icon={getSortIcon('studentStatus')} />}</th>
                                    <th>Actions</th>
                                </>
                            )}
                            {role === 'instructor' && (
                                <>
                                    <th onClick={() => requestSort('title')}><FontAwesomeIcon icon={faListAlt} /> Exam Title {getSortIcon('title') && <FontAwesomeIcon icon={getSortIcon('title')} />}</th>
                                    <th onClick={() => requestSort('dateCompleted')}><FontAwesomeIcon icon={faCalendarAlt} /> Date Ended {getSortIcon('dateCompleted') && <FontAwesomeIcon icon={getSortIcon('dateCompleted')} />}</th>
                                    <th onClick={() => requestSort('participants')}><FontAwesomeIcon icon={faUsers} /> Participants {getSortIcon('participants') && <FontAwesomeIcon icon={getSortIcon('participants')} />}</th>
                                    <th onClick={() => requestSort('avgScore')}><FontAwesomeIcon icon={faPercentage} /> Avg. Score {getSortIcon('avgScore') && <FontAwesomeIcon icon={getSortIcon('avgScore')} />}</th>
                                    <th onClick={() => requestSort('status')}><FontAwesomeIcon icon={faHistory} /> Quiz Status {getSortIcon('status') && <FontAwesomeIcon icon={getSortIcon('status')} />}</th>
                                    <th>Actions</th>
                                </>
                            )}
                        </tr>
                        </thead>
                        <tbody>
                        {sortedHistory.length === 0 ? (
                            <tr>
                                <td colSpan={role === 'student' ? 5 : (role === 'instructor' ? 6 : 1)} className="no-history-message">
                                    <FontAwesomeIcon icon={faInfoCircle} style={{ marginRight: '8px' }} />
                                    {historyData.length === 0 ? "No exam history found." : "No exam history matches your search/filter criteria."}
                                </td>
                            </tr>
                        ) : (
                            sortedHistory.map(item => {
                                const idForStudentDetails = item.id;
                                const idForInstructorDetails = item.examId;
                                const studentStatusFromDto = item?.studentStatus;
                                const reviewAvailable = role === 'student' && !!item.id && (item?.reviewAvailable !== false);

                                const title = item?.title ?? 'N/A';
                                const dateToDisplay = role === 'student' ? item?.dateTaken : (item?.endDate || item?.dateCompleted);
                                const score = item?.score;
                                const totalPoints = item?.totalPoints;
                                const participants = item?.participants;
                                const avgScore = item?.avgScore;
                                const instructorExamStatus = item?.status;

                                return (
                                    <tr key={item.uniqueListId}>
                                        {role === 'student' && (
                                            <>
                                                <td>{title}</td>
                                                <td>{formatDateTime(dateToDisplay)}</td>
                                                <td>
                                                    {score != null ? score : (studentStatusFromDto === 'NOT_ATTEMPTED') ? '0' : '-'}
                                                    {totalPoints != null ? ` / ${totalPoints}` : (studentStatusFromDto === 'NOT_ATTEMPTED' ? ' / N/A' : '')}
                                                </td>
                                                <td>{renderStudentStatusChip(studentStatusFromDto)}</td>
                                                <td>
                                                    {idForStudentDetails ? (
                                                        <button
                                                            className="action-btn details-btn"
                                                            title={reviewAvailable ? "View Review" : "Review Not Available"}
                                                            onClick={() => handleViewDetailsClick(idForStudentDetails)}
                                                            disabled={!reviewAvailable}
                                                        >
                                                            <FontAwesomeIcon icon={faEye} />
                                                        </button>
                                                    ) : (
                                                        studentStatusFromDto === 'NOT_ATTEMPTED' ? <span className="no-data-message">-</span> : <span className="no-data-message">No submission</span>
                                                    )}
                                                </td>
                                            </>
                                        )}
                                        {role === 'instructor' && (
                                            <>
                                                <td>{title}</td>
                                                <td>{formatDateTime(dateToDisplay)}</td>
                                                <td>{participants ?? '-'}</td>
                                                <td>{avgScore != null ? `${parseFloat(avgScore).toFixed(1)}%` : '-'}</td>
                                                <td>{renderInstructorExamStatusChip(instructorExamStatus)}</td>
                                                <td>
                                                    <button
                                                        className="action-btn results-btn"
                                                        title="View Detailed Results"
                                                        onClick={() => handleViewDetailsClick(idForInstructorDetails)}
                                                        disabled={!idForInstructorDetails}
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
                .history-filter-bar {
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
                .history-filter-bar .search-input-group {
                    position: relative;
                    flex-grow: 1;
                    min-width: 250px;
                }
                .history-filter-bar .search-icon {
                    position: absolute;
                    left: 15px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: var(--text-medium);
                    opacity: 0.6;
                }
                .history-filter-bar .input-field {
                    padding-left: 45px;
                    font-size: 0.9rem;
                    background-color: var(--input-bg);
                    border: 1px solid var(--border-light);
                    color: var(--text-light);
                    border-radius: var(--border-radius-sm);
                    width: 100%;
                    box-sizing: border-box;
                }
                .history-filter-bar .input-field:focus {
                    border-color: var(--accent-primary);
                    background-color: var(--input-bg-focus);
                    box-shadow: 0 0 0 2px var(--accent-primary-glow);
                }
                .history-filter-bar .filter-controls {
                    display: flex;
                    gap: 15px;
                    flex-wrap: wrap;
                }
                .history-filter-bar .select-group {
                    position: relative;
                    min-width: 180px;
                }
                .history-filter-bar .filter-icon {
                    position: absolute;
                    left: 15px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: var(--text-medium);
                    opacity: 0.6;
                    pointer-events: none;
                }
                .history-filter-bar .filter-select {
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
                .history-filter-bar .filter-select:focus {
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='%230ea5e9' viewBox='0 0 20 20'%3E%3Cpath d='M10 14l-5-5h10z'/%3E%3C/svg%3E");
                }
                @media (max-width: 768px) {
                    .history-filter-bar {
                        flex-direction: column;
                        align-items: stretch;
                    }
                    .history-filter-bar .search-input-group {
                        min-width: unset;
                        width: 100%;
                    }
                    .history-filter-bar .filter-controls {
                        width: 100%;
                    }
                    .history-filter-bar .select-group {
                        min-width: unset;
                        width: 100%;
                    }
                }
                .history-table th svg { margin-right: 6px; }
                .action-btn:disabled { opacity: 0.4; cursor: not-allowed; }
                .no-data-message { font-size: 0.85em; color: var(--text-medium); font-style: italic; }
                .no-history-message {
                    padding: 30px;
                    text-align: center;
                    font-style: italic;
                    color: var(--text-medium);
                }
                .no-history-message svg {
                    margin-right: 8px;
                    color: var(--text-medium);
                }

            `}</style>
        </div>
    );
}

export default ExamHistoryPage;
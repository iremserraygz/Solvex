import React, { useState, useMemo } from 'react';
import '../App.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faEdit, faTrashAlt, faChartBar, faFilter, faSearch,
    faClock, faCalendarAlt, faQuestionCircle, faCheckCircle, faPlayCircle,
    faPlusSquare, faSpinner, faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';

function ViewExamsPage({
                           examsData = [],
                           isLoading = false,
                           error = null,
                           onRetryFetch,
                           onEditExam,
                           onDeleteExam,
                           onViewResults,
                           onNavigateToCreate,
                       }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    const filteredExams = useMemo(() => {
        if (!Array.isArray(examsData)) return [];
        return examsData.filter(exam => {
            if (!exam || !exam.title) return false;
            const searchMatch = exam.title.toLowerCase().includes(searchTerm.toLowerCase());
            const statusMatch = filterStatus ? exam.status === filterStatus : true;
            return searchMatch && statusMatch;
        });
    }, [examsData, searchTerm, filterStatus]);

    const formatDateTime = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return "Invalid Date";
            return date.toLocaleString(navigator.language || 'en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
        } catch (e) { return 'Format Error'; }
    };

    const renderStatusChip = (status) => {
        let statusClass = 'status-chip ';
        let icon = null;
        switch (status?.toUpperCase()) {
            case 'DRAFT': statusClass += 'status-draft'; icon = faEdit; break;
            case 'PUBLISHED': statusClass += 'status-published'; icon = faCalendarAlt; break;
            case 'ACTIVE': statusClass += 'status-active'; icon = faPlayCircle; break;
            case 'ENDED': statusClass += 'status-ended'; icon = faCheckCircle; break;
            default: statusClass += 'status-other';
        }
        return (
            <span className={statusClass}>
                {icon && <FontAwesomeIcon icon={icon} style={{ marginRight: '5px' }}/>} {status || 'Unknown'}
            </span>
        );
    };

    if (isLoading) {
        return <div className="loading-placeholder"><FontAwesomeIcon icon={faSpinner} spin size="2x" /><p>Loading exams...</p></div>;
    }
    if (error) {
        return <div className="error-message-container widget-card">
                   <FontAwesomeIcon icon={faExclamationTriangle} size="2x" style={{color: 'var(--error-color)', marginBottom: '15px'}}/>
                   <h4>Error Loading Exams</h4>
                   <p style={{color: 'var(--text-medium)'}}>{error}</p>
                   {onRetryFetch && <button onClick={onRetryFetch} className="widget-button secondary">Retry</button>}
               </div>;
    }

    return (
        <div className="view-exams-page animated-fade-in-up">
            <div className="filter-bar">
                <div className="search-input-group">
                    <FontAwesomeIcon icon={faSearch} className="search-icon" />
                    <input type="text" className="input-field" placeholder="Search exams by title..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <div className="filter-controls">
                    <div className="select-group">
                        <FontAwesomeIcon icon={faFilter} className="filter-icon" />
                        <select className="filter-select input-field" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                            <option value="">All Statuses</option>
                            <option value="DRAFT">Draft</option>
                            <option value="PUBLISHED">Published</option>
                            <option value="ACTIVE">Active</option>
                            <option value="ENDED">Ended</option>
                        </select>
                    </div>
                </div>
                {onNavigateToCreate && (
                     <button className="widget-button primary add-new-q-btn" onClick={onNavigateToCreate}>
                        <FontAwesomeIcon icon={faPlusSquare} /> Create New Exam
                    </button>
                )}
            </div>

            <div className="list-container">
                {filteredExams.length === 0 ? (
                    <p className="no-items-message widget-card">
                        {examsData.length === 0 ? "You haven't created any exams yet." : "No exams found matching your criteria."}
                        {examsData.length === 0 && onNavigateToCreate && (
                            <button onClick={onNavigateToCreate} className="widget-button primary" style={{marginTop: '15px'}}>Create Your First Exam</button>
                        )}
                    </p>
                ) : (
                    <div className="table-container">
                        <table className="exam-table">
                            <thead>
                            <tr>
                                <th>Title</th>
                                <th>Status</th>
                                <th style={{textAlign: 'center'}}><FontAwesomeIcon icon={faQuestionCircle} title="Questions"/> Qs</th>
                                <th style={{textAlign: 'center'}}><FontAwesomeIcon icon={faClock} title="Duration"/> (min)</th>
                                <th>Start Date</th>
                                <th>End Date</th>
                                <th>Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {filteredExams.map(exam => (
                                <tr key={exam.id}>
                                    <td data-label="Title">{exam.title}</td>
                                    <td data-label="Status">{renderStatusChip(exam.status)}</td>
                                    <td data-label="Questions" style={{textAlign: 'center'}}>{exam.questions}</td>
                                    <td data-label="Duration" style={{textAlign: 'center'}}>{exam.duration}</td>
                                    <td data-label="Start Date">{formatDateTime(exam.startDate)}</td>
                                    <td data-label="End Date">{formatDateTime(exam.endDate)}</td>
                                    <td data-label="Actions">
                                        <div className="action-buttons">
                                            <button
                                                className="action-btn edit-btn"
                                                title="Edit Exam"
                                                onClick={() => onEditExam(exam.id)}
                                                disabled={exam.status === 'ENDED' || exam.status === 'ACTIVE'}
                                            >
                                                <FontAwesomeIcon icon={faEdit} />
                                            </button>
                                            <button
                                                className="action-btn results-btn"
                                                title="View Results"
                                                onClick={() => onViewResults(exam.id)}
                                                disabled={exam.status === 'DRAFT' || exam.status === 'PUBLISHED'}
                                            >
                                                <FontAwesomeIcon icon={faChartBar} />
                                            </button>
                                            <button
                                                className="action-btn delete-btn"
                                                title="Delete Exam"
                                                onClick={() => onDeleteExam(exam.id)}
                                                disabled={exam.status === 'ACTIVE'}
                                            >
                                                <FontAwesomeIcon icon={faTrashAlt} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
export default ViewExamsPage;
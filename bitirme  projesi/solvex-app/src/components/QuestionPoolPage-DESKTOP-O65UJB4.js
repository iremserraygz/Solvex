import React, { useState, useMemo, useEffect, useCallback } from 'react';
import '../App.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSearch, faFilter, faEdit, faTrashAlt, faPlus, faTag, faList,
    faStar, faSpinner, faExclamationTriangle, faCheck, faTimes // Added faTimes for Cancel
} from '@fortawesome/free-solid-svg-icons';

function QuestionPoolPage({
    questions = [],
    isLoading = false,
    error = null,
    onRetryFetch,
    mode = 'poolManagement',
    onNavigateToCreate,
    onEditQuestion,
    onDeleteQuestion,
    onAddSelectedToExam,
    onCancel,
    existingQuestionIdsInExam = new Set(),
}) {

    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    // Selection state remains internal to this component
    const [selectedQuestions, setSelectedQuestions] = useState(new Set());

    // Clear selection when mode changes or questions reload
    useEffect(() => {
        setSelectedQuestions(new Set());
    }, [mode, questions]);

    //Filtering and Category Logic
    const filteredQuestions = useMemo(() => {
        if (isLoading || error) return [];
        return questions.filter(q => {
            if (!q) return false;
            const searchMatch = (q.text?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                                (q.category?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                                (q.title?.toLowerCase().includes(searchTerm.toLowerCase())); // Include optional title in search
            const typeMatch = filterType ? q.type === filterType : true;
            const categoryMatch = filterCategory ? q.category === filterCategory : true;
            return searchMatch && typeMatch && categoryMatch;
        });
    }, [questions, searchTerm, filterType, filterCategory, isLoading, error]);

    const categories = useMemo(() => {
        if (isLoading || error) return [];
        return [...new Set(questions.map(q => q.category).filter(Boolean))].sort();
    }, [questions, isLoading, error]);

    //Selection Handler (Modified to check if already in exam)
    const handleSelectQuestion = useCallback((questionId, isSelected) => {
        if (mode === 'addToExam' && existingQuestionIdsInExam.has(questionId)) {
            // Prevent selecting questions already in the exam draft for "Add" mode
            return;
        }
        setSelectedQuestions(prevSelected => {
            const newSelected = new Set(prevSelected);
            if (isSelected) {
                newSelected.add(questionId);
            } else {
                newSelected.delete(questionId);
            }
            return newSelected;
        });
    }, [mode, existingQuestionIdsInExam]); // Dependencies for the check

    const handleAddSelectedClick = useCallback(() => {
        if (selectedQuestions.size === 0) {
            alert("Please select at least one question to add.");
            return;
        }
        if (onAddSelectedToExam) {
            onAddSelectedToExam(selectedQuestions); // Pass the Set
            // Selection is cleared by useEffect when navigating back
        } else {
            console.error("onAddSelectedToExam prop function is missing!");
        }
    }, [selectedQuestions, onAddSelectedToExam]);

    const handleCancelClick = useCallback(() => {
         if (onCancel) {
            onCancel(); // Call the cancel handler from parent
            // Selection is cleared by useEffect when navigating back
        } else {
            console.error("onCancel prop function is missing!");
        }
    }, [onCancel]);

    const handleEdit = (questionId) => {
        if (mode === 'poolManagement' && onEditQuestion) {
            onEditQuestion(questionId);
        }
    }

    const handleDelete = (questionId) => {
         if (mode === 'poolManagement' && onDeleteQuestion) {
            onDeleteQuestion(questionId);
        }
    }

    const handleRowClick = (questionId) => {
        // Only allow selection toggle on row click if not already in exam (in add mode)
        if (mode === 'addToExam' && existingQuestionIdsInExam.has(questionId)) {
            return;
        }
         handleSelectQuestion(questionId, !selectedQuestions.has(questionId));
    }

    return (
        <div className="question-pool-page">
            {/* Filter Bar */}
            <div className="filter-bar widget-card">
                {/* Search and Filter controls */}
                 <div className="search-input-group">
                    <FontAwesomeIcon icon={faSearch} className="search-icon" />
                    <input type="text" className="input-field" placeholder="Search questions..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} disabled={isLoading} />
                 </div>
                 <div className="filter-controls">
                     <div className="select-group">
                         <FontAwesomeIcon icon={faList} className="filter-icon"/>
                         <select className="filter-select input-field" value={filterType} onChange={(e) => setFilterType(e.target.value)} disabled={isLoading}>
                             <option value="">All Types</option>
                             <option value="MCQ">Multiple Choice</option>
                             <option value="TF">True/False</option>
                             <option value="Short Answer">Short Answer</option>
                         </select>
                     </div>
                     <div className="select-group">
                         <FontAwesomeIcon icon={faTag} className="filter-icon"/>
                         <select className="filter-select input-field" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} disabled={isLoading || categories.length === 0}>
                             <option value="">All Categories</option>
                             {categories.map(cat => (<option key={cat} value={cat}>{cat}</option>))}
                         </select>
                     </div>
                 </div>
                 {/* Mode-Specific Action Buttons */}
                 <div className="pool-actions">
                     {mode === 'poolManagement' && (
                         <button className="widget-button primary add-new-q-btn" onClick={onNavigateToCreate} disabled={isLoading}>
                             <FontAwesomeIcon icon={faPlus} /> Create New
                         </button>
                     )}
                     {mode === 'addToExam' && (
                         <>
                             <button
                                 className="widget-button secondary cancel-btn" // Add specific class if needed
                                 onClick={handleCancelClick}
                                 disabled={isLoading}
                                 title="Go back without adding"
                             >
                                 <FontAwesomeIcon icon={faTimes} /> Cancel
                             </button>
                              <button
                                 className="widget-button primary add-selected-btn"
                                 onClick={handleAddSelectedClick}
                                 disabled={isLoading || selectedQuestions.size === 0}
                                 title={selectedQuestions.size === 0 ? "Select questions first" : "Add selected questions to exam"}
                             >
                                 <FontAwesomeIcon icon={faCheck} /> Add Selected ({selectedQuestions.size})
                             </button>
                         </>
                     )}
                 </div>
            </div>

            {/* Question List Area */}
            <div className="question-list-pool widget-card">
                <div className="list-header">
                    <h4>
                        {/* Mode-Specific Title */}
                        {mode === 'addToExam' ? 'Select Questions to Add' : 'Question Pool'}
                         ({isLoading ? 'Loading...' : `${filteredQuestions.length} found`})
                         {selectedQuestions.size > 0 && ` - ${selectedQuestions.size} selected`}
                    </h4>
                 </div>

                 {isLoading && ( <div className="loading-placeholder" style={{ padding: '40px 20px' }}><FontAwesomeIcon icon={faSpinner} spin size="lg" /> Loading Questions...</div> )}
                 {!isLoading && error && ( <div className="error-message-container" style={{ padding: '20px' }}><FontAwesomeIcon icon={faExclamationTriangle} style={{ color: 'var(--error-color)', marginRight: '10px' }}/> Error: {error} {onRetryFetch && <button onClick={onRetryFetch} className="widget-button secondary" style={{marginLeft: '15px'}}>Retry</button>}</div> )}

                 {!isLoading && !error && (
                     filteredQuestions.length > 0 ? (
                         <ul className="list-items">
                             {filteredQuestions.map(q => {
                                 const isSelected = selectedQuestions.has(q.id);
                                 const alreadyInExam = mode === 'addToExam' && existingQuestionIdsInExam.has(q.id);
                                 const isDisabled = alreadyInExam; // Disable row click/selection if already in exam

                                 return (
                                     <li
                                         key={q.id}
                                         className={`question-item ${isSelected ? 'selected' : ''} ${alreadyInExam ? 'already-in-exam' : ''}`}
                                         onClick={() => !isDisabled && handleRowClick(q.id)} // Only handle click if not disabled
                                         aria-disabled={isDisabled}
                                         style={{ cursor: isDisabled ? 'not-allowed' : 'pointer', opacity: isDisabled ? 0.6 : 1 }} // Visual feedback
                                     >
                                         {/* Checkbox */}
                                         <div className="question-item-select" onClick={(e) => e.stopPropagation()}>
                                             <input
                                                 type="checkbox"
                                                 id={`select-${q.id}`}
                                                 checked={isSelected}
                                                 onChange={(e) => handleSelectQuestion(q.id, e.target.checked)}
                                                 disabled={isDisabled} // Disable checkbox too
                                                 aria-labelledby={`text-${q.id}`}
                                             />
                                             <label htmlFor={`select-${q.id}`} className="checkbox-label" aria-hidden="true"></label>
                                         </div>
                                         {/* Content */}
                                         <div className="question-item-main">
                                             <span className="question-item-text" id={`text-${q.id}`}>
                                                 {alreadyInExam && <FontAwesomeIcon icon={faCheck} title="Already in exam draft" style={{ color: 'var(--student-accent)', marginRight: '8px' }} />}
                                                 {q.text}
                                                 {q.title && <span className="question-title-chip"> ({q.title})</span>} {/* Display optional title */}
                                             </span>
                                         </div>
                                         {/* Details */}
                                         <div className="question-item-details">
                                             <span className="detail-chip type">{q.type}</span>
                                             {q.category && <span className="detail-chip category">{q.category}</span>}
                                             <span className="detail-chip points"><FontAwesomeIcon icon={faStar}/> {q.points} pts</span>
                                         </div>
                                         {/* Actions (Only in pool management mode) */}
                                         {mode === 'poolManagement' && (
                                             <div className="question-item-actions" onClick={(e) => e.stopPropagation()}>
                                                 <button className="action-btn edit-btn" title="Edit Question" onClick={() => handleEdit(q.id)}>
                                                     <FontAwesomeIcon icon={faEdit} />
                                                 </button>
                                                 <button className="action-btn delete-btn" title="Delete Question" onClick={() => handleDelete(q.id)}>
                                                     <FontAwesomeIcon icon={faTrashAlt} />
                                                 </button>
                                             </div>
                                         )}
                                     </li>
                                 );
                             })}
                         </ul>
                     ) : (
                         <p className="no-questions-message">
                             {questions.length === 0 && !isLoading ? "Question pool is empty." : "No questions found matching your criteria."}
                         </p>
                     )
                 )}
            </div>
             {/* Scoped Styles */}
             <style jsx>{`
                .filter-bar { align-items: center; }
                .pool-actions { display: flex; gap: 10px; margin-left: auto; }
                .loading-placeholder, .error-message-container { text-align: center; color: var(--text-medium); }
                .question-list-pool { padding: 0; }
                .question-item.already-in-exam {
                     /* Style for questions already in the draft */
                     opacity: 0.6;
                     cursor: not-allowed;
                 }
                 .question-item.already-in-exam:hover {
                     background-color: var(--card-bg); /* Prevent hover effect */
                 }
                 .question-title-chip {
                     font-size: 0.8em;
                     color: var(--text-medium);
                     margin-left: 8px;
                     font-style: italic;
                 }
                 /* Responsive adjustments */
                 @media (max-width: 992px) {
                     .filter-bar { flex-direction: column; align-items: stretch; }
                     .pool-actions { margin-left: 0; margin-top: 15px; width: 100%; justify-content: space-between; }
                 }
                  @media (max-width: 768px) {
                    .pool-actions { flex-direction: column; gap: 10px; }
                     .add-selected-btn, .add-new-q-btn, .cancel-btn { width: 100%; }
                 }
             `}</style>
        </div>
    );
}

export default QuestionPoolPage;
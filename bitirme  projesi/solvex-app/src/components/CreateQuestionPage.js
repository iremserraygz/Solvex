import React, { useState, useEffect } from 'react';
import '../App.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faPlus, faStar, faSyncAlt } from '@fortawesome/free-solid-svg-icons';

function CreateQuestionPage({
                                onBack,
                                onSave,
                                onUpdate,
                                initialQuestionData = null
                            }) {

    const [title, setTitle] = useState(initialQuestionData?.title || '');
    const [category, setCategory] = useState(initialQuestionData?.category || '');
    const [questionText, setQuestionText] = useState(initialQuestionData?.text || '');
    const [questionType, setQuestionType] = useState(initialQuestionData?.type || 'MCQ');
    const [points, setPoints] = useState(initialQuestionData?.points || 10);
    const [difficultyLevel, setDifficultyLevel] = useState(initialQuestionData?.difficultylevel || 'Medium');

    const initialOptions = initialQuestionData?.options || [];
    const paddedOptions = Array(4).fill('').map((_, i) => initialOptions[i] || '');
    const [options, setOptions] = useState(paddedOptions);
    const [correctAnswerMCQ, setCorrectAnswerMCQ] = useState(
        initialQuestionData?.type === 'MCQ' ? initialQuestionData.answer : ''
    );

    const [correctAnswerShort, setCorrectAnswerShort] = useState(
        initialQuestionData?.type === 'Short Answer' ? initialQuestionData.answer : ''
    );

    const [correctAnswerTF, setCorrectAnswerTF] = useState(
        initialQuestionData?.type === 'TF' ? initialQuestionData.answer : 'True'
    );

    const isEditMode = !!initialQuestionData;

    useEffect(() => {
        if (initialQuestionData) {
            setTitle(initialQuestionData.title || '');
            setCategory(initialQuestionData.category || '');
            setQuestionText(initialQuestionData.text || '');
            setQuestionType(initialQuestionData.type || 'MCQ');
            setPoints(initialQuestionData.points || 10);
            setDifficultyLevel(initialQuestionData.difficultylevel || 'Medium');
            const loadedOptions = initialQuestionData.options || [];
            setOptions(Array(4).fill('').map((_, i) => loadedOptions[i] || ''));
            setCorrectAnswerMCQ(initialQuestionData.type === 'MCQ' ? initialQuestionData.answer : '');
            setCorrectAnswerShort(initialQuestionData.type === 'Short Answer' ? initialQuestionData.answer : '');
            setCorrectAnswerTF(initialQuestionData.type === 'TF' ? initialQuestionData.answer : 'True');
        } else {
             setTitle('');
             setCategory('');
             setQuestionText('');
             setQuestionType('MCQ');
             setPoints(10);
             setDifficultyLevel('Medium');
             setOptions(['', '', '', '']);
             setCorrectAnswerMCQ('');
             setCorrectAnswerShort('');
             setCorrectAnswerTF('True');
        }
    }, [initialQuestionData]);


    const handleOptionChange = (index, value) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    const handleTypeChange = (e) => {
        const newType = e.target.value;
        setQuestionType(newType);
        if (!isEditMode || initialQuestionData?.type !== newType) {
            setCorrectAnswerMCQ('');
            setCorrectAnswerShort('');
            setCorrectAnswerTF('True');
            if (newType !== 'MCQ') {
                setOptions(['', '', '', '']);
            } else if (options.join('') === '') {
                 setOptions(['', '', '', '']);
            }
        }
    }

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!questionText.trim()) {
            alert("Please enter the Question Text.");
            return;
        }
         if (!category.trim()) {
            alert("Please enter or select a Category.");
            return;
        }
         if (points == null || points <= 0) {
            alert("Please enter a valid Point value (must be greater than 0).");
            return;
        }
        if (!questionType) {
             alert("Please select a Question Type.");
             return;
        }

        let questionPayload = {
            ...(isEditMode && { id: initialQuestionData.id }),
            title: title.trim(),
            category: category.trim(),
            questiontitle: questionText.trim(),
            type: questionType,
            points: parseInt(points, 10),
            difficultylevel: difficultyLevel,
            option1: null,
            option2: null,
            option3: null,
            option4: null,
            rightanswer: null,
        };

        if (questionType === 'MCQ') {
            const trimmedOptions = options.map(opt => opt.trim());
            if (trimmedOptions.some(opt => !opt) || !correctAnswerMCQ) {
                alert("For Multiple Choice, please provide all four options and select the correct answer.");
                return;
            }
            questionPayload.option1 = trimmedOptions[0];
            questionPayload.option2 = trimmedOptions[1];
            questionPayload.option3 = trimmedOptions[2];
            questionPayload.option4 = trimmedOptions[3];
            const correctIndex = correctAnswerMCQ.charCodeAt(0) - 65;
            if (correctIndex >= 0 && correctIndex < 4) {
                questionPayload.rightanswer = trimmedOptions[correctIndex];
            } else {
                 alert("Invalid correct answer selected for MCQ.");
                 return;
            }
        } else if (questionType === 'Short Answer') {
            if (!correctAnswerShort.trim()) {
                alert("For Short Answer, please provide the correct answer.");
                return;
            }
            questionPayload.rightanswer = correctAnswerShort.trim();
        } else if (questionType === 'TF') {
            if (correctAnswerTF !== 'True' && correctAnswerTF !== 'False') {
                alert("Please select True or False as the correct answer.");
                return;
            }
            questionPayload.rightanswer = correctAnswerTF;
        } else {
            alert(`Unsupported question type selected: ${questionType}`);
            return;
        }

        if (isEditMode) {
            console.log("Updating question:", questionPayload);
            if (onUpdate) {
                onUpdate(questionPayload);
            } else {
                console.error("onUpdate prop is missing!");
                alert("Error: Cannot update question.");
            }
        } else {
            console.log("Adding new question:", questionPayload);
            if (onSave) {
                onSave(questionPayload);
            } else {
                console.error("onSave prop is missing!");
                 alert("Error: Cannot save new question.");
            }
        }
    };

    return (
        <div className="create-question-page animated-fade-in-up">
            <div className="page-header-actions">
                <button onClick={onBack} className="back-button-page">
                    <FontAwesomeIcon icon={faChevronLeft} />
                     Back to {isEditMode ? 'Question Pool' : 'Previous Page'} {}
                </button>
            </div>

            <form onSubmit={handleSubmit}>

                <div className="widget-card form-card">
                    <h3>Question Details</h3>
                    <div className="form-grid">

                        <div className="form-column">
                            <div className="input-group">

                                <label htmlFor="qTitle" className="form-label">Title (Optional)</label>
                                <input id="qTitle" type="text" className="input-field" value={title} onChange={e => setTitle(e.target.value)} />
                            </div>
                            <div className="input-group">

                                <label htmlFor="qCategory" className="form-label">Category*</label>
                                <input id="qCategory" type="text" className="input-field" value={category} onChange={e => setCategory(e.target.value)} required placeholder="e.g., React Basics, Java Fundamentals"/>
                            </div>
                            <div className="form-row">

                                <div className="input-group half-width">
                                    <label htmlFor="qDifficulty" className="form-label">Difficulty Level</label>
                                    <select id="qDifficulty" className="input-field select-field" value={difficultyLevel} onChange={e => setDifficultyLevel(e.target.value)}>
                                        <option value="Easy">Easy</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Hard">Hard</option>
                                    </select>
                                </div>

                                <div className="input-group half-width">
                                    <label htmlFor="qPoints" className="form-label"><FontAwesomeIcon icon={faStar} /> Points*</label>
                                    <input
                                        type="number"
                                        id="qPoints"
                                        className="input-field"
                                        value={points}
                                        onChange={(e) => setPoints(e.target.value)}
                                        min="1"
                                        required
                                    />
                                </div>
                            </div>
                             <div className="input-group">
                                <label htmlFor="qType" className="form-label">Question Type*</label>
                                <select id="qType" className="input-field select-field" value={questionType} onChange={handleTypeChange} required>
                                    <option value="MCQ">Multiple Choice</option>
                                    <option value="Short Answer">Short Answer</option>
                                    <option value="TF">True / False</option>
                                </select>
                            </div>
                        </div>


                        <div className="form-column">
                            <div className="input-group full-height">
                                <label htmlFor="qText" className="form-label">Question Text*</label>
                                <textarea id="qText" className="input-field text-area" rows="9" value={questionText} onChange={e => setQuestionText(e.target.value)} placeholder="Enter the main question here..." required/>
                            </div>
                        </div>
                    </div>
                </div>

                {questionType === 'MCQ' && (
                    <div className="widget-card form-card options-card animated-fade-in-up" style={{animationDelay: '0.1s'}}>
                        <h4>Options & Correct Answer (MCQ)</h4>
                        <div className="options-grid">
                            {options.map((option, index) => (
                                <div key={index} className="input-group option-input">
                                    <label htmlFor={`option${index}`} className="form-label option-label">{String.fromCharCode(65 + index)} )</label>
                                    <input type="text" id={`option${index}`} className="input-field" value={option} onChange={(e) => handleOptionChange(index, e.target.value)} placeholder={`Option ${String.fromCharCode(65 + index)}`} required />
                                </div>
                            ))}
                        </div>
                        <div className="input-group correct-answer-group">
                            <label htmlFor="correctAnswerMCQ" className="form-label">Correct Answer*</label>
                            <select id="correctAnswerMCQ" className="input-field select-field" value={correctAnswerMCQ} onChange={e => setCorrectAnswerMCQ(e.target.value)} required>
                                <option value="" disabled>Select correct option</option>
                                <option value="A">A</option>
                                <option value="B">B</option>
                                <option value="C">C</option>
                                <option value="D">D</option>
                            </select>
                        </div>
                    </div>
                )}

                {questionType === 'Short Answer' && (
                    <div className="widget-card form-card options-card animated-fade-in-up" style={{animationDelay: '0.1s'}}>
                        <h4>Correct Answer (Short Answer)</h4>
                        <div className="input-group">
                            <label htmlFor="correctAnswerShort" className="form-label">Expected Answer*</label>
                            <input
                                type="text"
                                id="correctAnswerShort"
                                className="input-field"
                                value={correctAnswerShort}
                                onChange={(e) => setCorrectAnswerShort(e.target.value)}
                                placeholder="Enter the exact expected answer..."
                                required
                            />
                            <small className="input-hint">Note: Answer matching is case-sensitive by default.</small>
                        </div>
                    </div>
                )}

                {questionType === 'TF' && (
                    <div className="widget-card form-card options-card animated-fade-in-up" style={{animationDelay: '0.1s'}}>
                        <h4>Correct Answer (True/False)</h4>
                        <div className="input-group tf-options">
                            <label className="form-label">Select the correct statement:</label>
                            <div className="radio-group">
                                <label htmlFor="tfTrue">
                                    <input type="radio" id="tfTrue" name="correctAnswerTF" value="True" checked={correctAnswerTF === 'True'} onChange={e => setCorrectAnswerTF(e.target.value)} />
                                    <span>True</span>
                                </label>
                                <label htmlFor="tfFalse">
                                    <input type="radio" id="tfFalse" name="correctAnswerTF" value="False" checked={correctAnswerTF === 'False'} onChange={e => setCorrectAnswerTF(e.target.value)} />
                                    <span>False</span>
                                </label>
                            </div>
                        </div>
                    </div>
                )}

                <div className="action-buttons">
                    <button type="submit" className="widget-button primary large-button">
                        <FontAwesomeIcon icon={isEditMode ? faSyncAlt : faPlus} />
                        {isEditMode ? 'Update Question' : 'Save Question'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default CreateQuestionPage;
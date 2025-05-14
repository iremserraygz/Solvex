// src/main/java/com/qs/question_service/service/QuestionService.java
package com.qs.question_service.service;

import com.qs.question_service.model.QuestionWrapper;
import com.qs.question_service.model.Response;
import lombok.extern.slf4j.Slf4j;
import com.qs.question_service.dao.QuestionDao;
import com.qs.question_service.model.Question;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.EmptyResultDataAccessException; // Import for delete
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional; // Import Transactional

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
public class QuestionService {

    @Autowired
    private QuestionDao questionDao;

    // --- getAllQuestions (no change) ---
    public ResponseEntity<List<Question>> getAllQuestions(){
        try{
            List<Question> questions = questionDao.findAll();
            log.info("Retrieved {} questions from database.", questions.size());
            return new ResponseEntity<>(questions, HttpStatus.OK);
        } catch (Exception e){
            log.error("Error fetching all questions", e);
            return new ResponseEntity<>(new ArrayList<>(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // --- getQuestionsByCategory (no change) ---
    public ResponseEntity<List<Question>> getQuestionsByCategory(String category) {
        if (category == null || category.trim().isEmpty()) {
            log.warn("Attempted to fetch questions with null or empty category.");
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
        try{
            List<Question> questions = questionDao.findByCategory(category);
            log.info("Retrieved {} questions for category: {}", questions.size(), category);
            return new ResponseEntity<>(questions, HttpStatus.OK);
        } catch (Exception e){
            log.error("Error fetching questions for category: {}", category, e);
            return new ResponseEntity<>(new ArrayList<>(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // --- addQuestion (no change needed in logic, returns saved object) ---
    @Transactional // Use transactional for DB writes
    public ResponseEntity<Question> addQuestion(Question question) {
        if (question == null || question.getQuestiontitle() == null || question.getQuestiontitle().trim().isEmpty() ||
                question.getRightanswer() == null || question.getRightanswer().trim().isEmpty() ||
                question.getCategory() == null || question.getCategory().trim().isEmpty() ||
                question.getType() == null || question.getType().trim().isEmpty() ||
                question.getPoints() == null || question.getPoints() < 0) {
            log.warn("Attempted to add question with missing or invalid required fields: {}", question);
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
        if ("MCQ".equalsIgnoreCase(question.getType())) {
            if (question.getOption1() == null || question.getOption1().trim().isEmpty() ||
                    question.getOption2() == null || question.getOption2().trim().isEmpty() ||
                    question.getOption3() == null || question.getOption3().trim().isEmpty() ||
                    question.getOption4() == null || question.getOption4().trim().isEmpty()) {
                log.warn("Attempted to add MCQ question with missing options: {}", question);
                return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
            }
        }
        try {
            question.setId(null); // Ensure it's treated as new
            Question savedQuestion = questionDao.save(question);
            log.info("Successfully added question ID: {}", savedQuestion.getId());
            return new ResponseEntity<>(savedQuestion, HttpStatus.CREATED);
        } catch (DataAccessException e) {
            log.error("Database error adding question: {}", e.getMessage(), e);
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        } catch (Exception e) {
            log.error("Unexpected error adding question", e);
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // --- NEW: updateQuestion Method ---
    @Transactional // Use transactional for DB updates
    public ResponseEntity<Question> updateQuestion(Integer id, Question updatedQuestionData) {
        if (id == null) {
            log.warn("Attempted to update question with null ID.");
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
        // Validate incoming data (similar to addQuestion)
        if (updatedQuestionData == null || updatedQuestionData.getQuestiontitle() == null || updatedQuestionData.getQuestiontitle().trim().isEmpty() ||
                updatedQuestionData.getRightanswer() == null || updatedQuestionData.getRightanswer().trim().isEmpty() ||
                updatedQuestionData.getCategory() == null || updatedQuestionData.getCategory().trim().isEmpty() ||
                updatedQuestionData.getType() == null || updatedQuestionData.getType().trim().isEmpty() ||
                updatedQuestionData.getPoints() == null || updatedQuestionData.getPoints() < 0) {
            log.warn("Attempted to update question ID {} with missing or invalid required fields: {}", id, updatedQuestionData);
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
        if ("MCQ".equalsIgnoreCase(updatedQuestionData.getType())) {
            if (updatedQuestionData.getOption1() == null || updatedQuestionData.getOption1().trim().isEmpty() ||
                    updatedQuestionData.getOption2() == null || updatedQuestionData.getOption2().trim().isEmpty() ||
                    updatedQuestionData.getOption3() == null || updatedQuestionData.getOption3().trim().isEmpty() ||
                    updatedQuestionData.getOption4() == null || updatedQuestionData.getOption4().trim().isEmpty()) {
                log.warn("Attempted to update MCQ question ID {} with missing options.", id);
                return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
            }
        }

        try {
            // 1. Find the existing question
            Optional<Question> existingQuestionOpt = questionDao.findById(id);
            if (!existingQuestionOpt.isPresent()) {
                log.warn("Question with ID {} not found for update.", id);
                return new ResponseEntity<>(HttpStatus.NOT_FOUND); // Return 404 if not found
            }
            Question existingQuestion = existingQuestionOpt.get();

            // 2. Update the fields of the existing entity
            existingQuestion.setQuestiontitle(updatedQuestionData.getQuestiontitle());
            existingQuestion.setOption1(updatedQuestionData.getOption1());
            existingQuestion.setOption2(updatedQuestionData.getOption2());
            existingQuestion.setOption3(updatedQuestionData.getOption3());
            existingQuestion.setOption4(updatedQuestionData.getOption4());
            existingQuestion.setRightanswer(updatedQuestionData.getRightanswer());
            existingQuestion.setDifficultylevel(updatedQuestionData.getDifficultylevel());
            existingQuestion.setCategory(updatedQuestionData.getCategory());
            existingQuestion.setType(updatedQuestionData.getType());
            existingQuestion.setPoints(updatedQuestionData.getPoints());
            existingQuestion.setTitle(updatedQuestionData.getTitle()); // Update optional title

            // 3. Save the updated entity (JPA will perform an UPDATE)
            Question savedQuestion = questionDao.save(existingQuestion);
            log.info("Successfully updated question ID: {}", id);
            return new ResponseEntity<>(savedQuestion, HttpStatus.OK); // Return updated question with 200 OK

        } catch (DataAccessException e) {
            log.error("Database error updating question ID {}: {}", id, e.getMessage(), e);
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        } catch (Exception e) {
            log.error("Unexpected error updating question ID {}", id, e);
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    // --- ---

    // --- NEW: deleteQuestion Method ---
    @Transactional // Use transactional for DB deletes
    public ResponseEntity<Void> deleteQuestion(Integer id) {
        if (id == null) {
            log.warn("Attempted to delete question with null ID.");
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
        try {
            if (!questionDao.existsById(id)) {
                log.warn("Question with ID {} not found for deletion.", id);
                return new ResponseEntity<>(HttpStatus.NOT_FOUND);
            }
            questionDao.deleteById(id);
            log.info("Successfully deleted question ID: {}", id);
            return new ResponseEntity<>(HttpStatus.NO_CONTENT); // Return 204 No Content on success
        } catch (EmptyResultDataAccessException e) {
            log.warn("Question with ID {} not found for deletion (caught during delete).", id);
            return new ResponseEntity<>(HttpStatus.NOT_FOUND); // Should be caught by existsById, but double-check
        } catch (DataAccessException e) {
            log.error("Database error deleting question ID {}: {}", id, e.getMessage(), e);
            // Optionally check for constraint violations if questions are linked elsewhere
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        } catch (Exception e) {
            log.error("Unexpected error deleting question ID {}", id, e);
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    // --- ---


    // --- getQuestionsForQuiz (no change) ---
    public ResponseEntity<List<Integer>> getQuestionsForQuiz(String categoryName, Integer numQuestions) {
        if (categoryName == null || categoryName.trim().isEmpty()) {
            log.warn("Attempted to generate questions with null or empty category.");
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
        if (numQuestions == null || numQuestions <= 0) {
            log.warn("Requested 0 or negative number of questions for category: {}", categoryName);
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
        try {
            List<Integer> questionIds = questionDao.findRandomQuestionsByCategory(categoryName, numQuestions);
            log.info("Generated {} random question IDs for category: {}", questionIds.size(), categoryName);
            if (questionIds.size() < numQuestions) {
                log.warn("Could only find {} questions for category '{}', requested {}.", questionIds.size(), categoryName, numQuestions);
            }
            return new ResponseEntity<>(questionIds,HttpStatus.OK);
        } catch (Exception e) {
            log.error("Error generating random questions for category: {}", categoryName, e);
            return new ResponseEntity<>(new ArrayList<>(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // --- getQuestionsFromId (no change) ---
    public ResponseEntity<List<QuestionWrapper>> getQuestionsFromId(List<Integer> questionIds) {
        if (questionIds == null || questionIds.isEmpty()) {
            log.warn("Received request to get questions with null or empty ID list.");
            return ResponseEntity.ok(new ArrayList<>());
        }
        log.info("Fetching question details for IDs: {}", questionIds);
        List<QuestionWrapper> wrappers = new ArrayList<>();
        List<Question> fetchedQuestions;

        try {
            fetchedQuestions = questionDao.findAllById(questionIds);
        } catch (Exception e) {
            log.error("Database error fetching questions by IDs: {}", questionIds, e);
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }

        if (fetchedQuestions.size() != questionIds.size()) {
            List<Integer> foundIds = fetchedQuestions.stream().map(Question::getId).collect(Collectors.toList());
            List<Integer> missingIds = questionIds.stream().filter(id -> !foundIds.contains(id)).collect(Collectors.toList());
            log.warn("Could not find all requested question IDs. Requested: {}, Found: {}. Missing IDs: {}", questionIds.size(), fetchedQuestions.size(), missingIds);
        }

        for (Question question : fetchedQuestions) {
            QuestionWrapper wrapper = new QuestionWrapper();
            wrapper.setId(question.getId());
            wrapper.setQuestiontitle(question.getQuestiontitle());
            wrapper.setOption1(question.getOption1());
            wrapper.setOption2(question.getOption2());
            wrapper.setOption3(question.getOption3());
            wrapper.setOption4(question.getOption4());
            wrapper.setType(question.getType());
            wrapper.setRightanswer(question.getRightanswer()); // Review için geçici
            wrapper.setPoints(question.getPoints() != null ? question.getPoints() : 0); // Ensure points are not null
            wrappers.add(wrapper);
        }
        log.info("Returning {} QuestionWrappers for requested IDs.", wrappers.size());
        return new ResponseEntity<>(wrappers,HttpStatus.OK);
    }

    // --- getScore (no change needed) ---
    public ResponseEntity<Integer> getScore(List<Response> responses) {
        if (responses == null || responses.isEmpty()) {
            log.warn("Received request to calculate score with null or empty responses list.");
            return ResponseEntity.ok(0);
        }
        log.info("Calculating score (based on points) for {} responses.", responses.size());
        int totalPoints = 0;
        int processed = 0;
        int notFound = 0;

        for (Response response : responses){
            if (response == null || response.getId() == null || response.getResponse() == null) {
                log.warn("Skipping invalid response object: {}", response);
                continue;
            }
            processed++;
            try {
                Optional<Question> questionOpt = questionDao.findById(response.getId());
                if(questionOpt.isPresent()){
                    Question question = questionOpt.get();
                    String correctAnswer = question.getRightanswer();
                    String userAnswer = response.getResponse();
                    boolean isCorrect = correctAnswer != null && userAnswer != null &&
                            correctAnswer.trim().equalsIgnoreCase(userAnswer.trim());

                    if (isCorrect) {
                        totalPoints += (question.getPoints() != null ? question.getPoints() : 0);
                    }
                } else {
                    notFound++;
                    log.warn("Question with ID {} not found during scoring.", response.getId());
                }
            } catch (Exception e) {
                log.error("Error processing score for response ID {}: {}", response.getId(), e.getMessage(), e);
            }
        }
        log.info("Score calculation complete: {} total points achieved from {} processed responses. {} questions not found.", totalPoints, processed, notFound);
        return new ResponseEntity<>(totalPoints, HttpStatus.OK);
    }
}
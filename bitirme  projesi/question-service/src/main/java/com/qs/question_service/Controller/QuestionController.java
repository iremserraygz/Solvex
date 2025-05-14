// src/main/java/com/qs/question_service/Controller/QuestionController.java
package com.qs.question_service.Controller;

import com.qs.question_service.model.Question;
import com.qs.question_service.model.QuestionWrapper;
import com.qs.question_service.model.Response;
import com.qs.question_service.service.QuestionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;

@RequestMapping("/question")
@RestController
public class QuestionController {

    private static final Logger log = LoggerFactory.getLogger(QuestionController.class);

    @Autowired
    private QuestionService questionService;

    @GetMapping("/allQuestions")
    public ResponseEntity<List<Question>> getAllQuestions(){
        log.info("Received request for all questions");
        return questionService.getAllQuestions();
    }

    @GetMapping("/category/{category}")
    public ResponseEntity<List<Question>> getQuestionByCategory(@PathVariable String category){
        log.info("Received request for questions by category: {}", category);
        return questionService.getQuestionsByCategory(category);
    }

    @PostMapping("/add")
    public ResponseEntity<Question> addQuestion(@RequestBody Question question){
        log.info("Received request to add question: {}", question.getQuestiontitle());
        return questionService.addQuestion(question);
    }

    // --- NEW: Endpoint for Updating a Question ---
    @PutMapping("/update/{id}") // Use PUT for update, include ID in path
    public ResponseEntity<Question> updateQuestion(
            @PathVariable Integer id,
            @RequestBody Question updatedQuestionData) {
        log.info("Received request to update question ID: {}", id);
        return questionService.updateQuestion(id, updatedQuestionData);
    }
    // --- ---

    // --- NEW: Endpoint for Deleting a Question ---
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteQuestion(@PathVariable Integer id) {
        log.info("Received request to delete question ID: {}", id);
        return questionService.deleteQuestion(id);
    }
    // --- ---

    @PostMapping("/generate")
    public ResponseEntity<List<Integer>> getQuestionsForQuiz(@RequestParam Integer numQuestions, @RequestParam String categoryName) {
        log.info("Received request to generate {} questions for category: {}", numQuestions, categoryName);
        return questionService.getQuestionsForQuiz(categoryName , numQuestions);
    }

    @PostMapping("/getQuestions")
    public ResponseEntity<List<QuestionWrapper>> getQuestionsFromId(@RequestBody List<Integer> questionIds){
        log.info("Received request to get question details for IDs: {}", questionIds);
        return questionService.getQuestionsFromId(questionIds);
    }

    @PostMapping("/getScore")
    public ResponseEntity<Integer> getScore(@RequestBody List<Response> responses){
        log.info("Received request to calculate score for {} responses", responses.size());
        return questionService.getScore(responses);
    }
}
package quiz_service.Controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import quiz_service.model.*;
import quiz_service.service.QuizService;
import java.util.List;

@RestController
@RequestMapping("/quiz")
public class QuizController {

    @Autowired
    QuizService quizService;

    @PostMapping("/create")
    public ResponseEntity<String> createQuiz(@RequestBody QuizDto quizDto){
        return quizService.createQuiz(quizDto.getCategoryName(), quizDto.getNumQuestions(), quizDto.getTitle());
    }

    @PostMapping("/save")
    public ResponseEntity<Quiz> saveFullQuiz(@RequestBody QuizCreationRequestDto quizCreationRequestDto) {
        return quizService.saveFullQuiz(quizCreationRequestDto);
    }

    @GetMapping("/instructor/all")
    public ResponseEntity<List<Quiz>> getAllQuizzesForInstructor() {
        return quizService.getAllQuizzesForInstructor();
    }

    @GetMapping("/details/{quizId}")
    public ResponseEntity<Quiz> getQuizDetailsById(@PathVariable Integer quizId) {
        return quizService.getQuizDetailsById(quizId);
    }

    @PutMapping("/update/{quizId}")
    public ResponseEntity<Quiz> updateQuiz(@PathVariable Integer quizId, @RequestBody QuizCreationRequestDto quizDto) {
        return quizService.updateQuiz(quizId, quizDto);
    }

    @DeleteMapping("/delete/{quizId}")
    public ResponseEntity<Void> deleteQuiz(@PathVariable Integer quizId) {
        return quizService.deleteQuiz(quizId);
    }

    @GetMapping("/{quizId}/results")
    public ResponseEntity<Object> getQuizResults(@PathVariable Integer quizId) {
        return quizService.getQuizResults(quizId);
    }

    @GetMapping("/getQuestions/{quizId}")
    public ResponseEntity<QuizSessionDto> getQuizQuestions(@PathVariable Integer quizId) {
        return quizService.getQuizQuestions(quizId);
    }

    @GetMapping("/available")
    public ResponseEntity<List<QuizInfoDto>> getAvailableQuizzes(
            @RequestParam Long userId
    ) {
        return quizService.getAvailableQuizzesForStudent(userId);
    }

    @PostMapping("/submit/{quizId}")
    public ResponseEntity<QuizSubmission> submitQuiz(
            @PathVariable Integer quizId,
            @RequestParam Long userId,
            @RequestBody List<Response> responses
    ) {
        return quizService.calculateResult(quizId, userId, responses);
    }

    @GetMapping("/history")
    public ResponseEntity<List<QuizInfoDto>> getExamHistory(
            @RequestParam Long userId
    ) {
        return quizService.getExamHistory(userId);
    }

    @GetMapping("/submission/{submissionId}/details")
    public ResponseEntity<QuizReviewDto> getSubmissionDetails(
            @PathVariable Long submissionId,
            @RequestParam Long userId
    ) {
        return quizService.getSubmissionDetails(submissionId, userId);
    }
}
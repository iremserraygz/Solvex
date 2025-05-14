package quiz_service.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

// DTO to hold data needed to start and take a quiz session on the frontend
@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuizSessionDto {
    private Integer quizId; // Renamed from 'id' in Quiz to avoid confusion
    private String title;
    private Integer durationMinutes;
    // Potentially add other relevant quiz metadata if needed by ExamTakingPage
    // e.g., passingScore
    private List<QuestionWrapper> questions; // List of questions for this quiz session
}
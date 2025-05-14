// src/main/java/quiz_service/model/QuizInfoDto.java
package quiz_service.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuizInfoDto {
    // Quiz'in kendi bilgileri
    private Integer id; // Quiz ID
    private String title;
    private Integer durationMinutes;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Integer passingScore;

    // Availability/Dynamic status for listing exams
    private String status; // e.g., "ACTIVE", "PUBLISHED" (upcoming), "ENDED"

    // History için Submission bilgileri
    private Long submissionId;
    private LocalDateTime dateTaken;
    private Integer score;
    private Integer totalPoints;
    private String studentStatus; // e.g., "PASSED", "FAILED", "COMPLETED", "NOT_ATTEMPTED" // <-- "NOT_ATTEMPTED" eklendi

    // Constructor for Available Quizzes View
    public QuizInfoDto(Integer id, String title, String dynamicStatus, Integer durationMinutes, LocalDateTime startDate, LocalDateTime endDate, Integer passingScore) {
        this.id = id;
        this.title = title;
        this.status = dynamicStatus;
        this.durationMinutes = durationMinutes;
        this.startDate = startDate;
        this.endDate = endDate;
        this.passingScore = passingScore;
        this.submissionId = null;
        this.dateTaken = null;
        this.score = null;
        // totalPoints for available quizzes might need to be fetched or set from Quiz entity if it has a pre-calculated total
        this.totalPoints = null; // Or calculate if possible
        this.studentStatus = null;
    }

    // Constructor for History View (from a QuizSubmission)
    public QuizInfoDto(QuizSubmission submission, Quiz quiz, String calculatedStudentStatus) {
        this.id = quiz.getId();
        this.title = quiz.getTitle();
        this.durationMinutes = quiz.getDurationMinutes();
        this.startDate = quiz.getStartDate();
        this.endDate = quiz.getEndDate();
        this.passingScore = quiz.getPassingScore();
        this.totalPoints = submission.getTotalPossiblePoints();

        this.submissionId = submission.getId();
        this.dateTaken = submission.getSubmissionDate();
        this.score = submission.getAchievedPoints();
        this.studentStatus = calculatedStudentStatus; // "PASSED", "FAILED", "COMPLETED"
        this.status = "ENDED";
    }

    // Constructor for Unattempted Ended Quizzes (MODIFIED)
    public QuizInfoDto(Quiz quiz, String studentStatusIfNotAttempted) { // studentStatusIfNotAttempted will be "NOT_ATTEMPTED"
        this.id = quiz.getId();
        this.title = quiz.getTitle();
        this.durationMinutes = quiz.getDurationMinutes();
        this.startDate = quiz.getStartDate();
        this.endDate = quiz.getEndDate();
        this.passingScore = quiz.getPassingScore();
        // For unattempted quizzes, total points would be the quiz's potential total.
        // This ideally should come from the Quiz entity or be calculated by summing question points.
        // For now, let's assume QuizService will try to calculate it or it might be on Quiz entity.
        // If Quiz entity doesn't store total points, this might remain null or require fetching questions.
        this.totalPoints = null; // Placeholder - QuizService should ideally populate this.
        // If quiz.getQuestionIds() is available and fetchQuestionsData is called,
        // it could be calculated there.

        this.submissionId = null;
        this.dateTaken = quiz.getEndDate(); // Use quiz end date as the "event" time
        this.score = null; // No score for unattempted
        this.studentStatus = studentStatusIfNotAttempted; // Should be "NOT_ATTEMPTED"
        this.status = "ENDED";
    }
}
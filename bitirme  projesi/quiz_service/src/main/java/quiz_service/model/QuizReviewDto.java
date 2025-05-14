package quiz_service.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuizReviewDto {
    private Long submissionId;
    private Integer quizId;
    private String quizTitle;
    private LocalDateTime dateTaken;
    private Integer achievedPoints;
    private Integer totalPossiblePoints;
    private List<QuestionReviewDetailDto> questions;
}
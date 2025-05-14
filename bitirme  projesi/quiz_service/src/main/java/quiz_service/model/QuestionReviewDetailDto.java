package quiz_service.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuestionReviewDetailDto {
    private Integer id;
    private String questiontitle;
    private String type;
    private Integer points;
    private List<String> options; // MCQ için
    private String correctAnswer;
    private String userAnswer;
    private Boolean isCorrect;
}
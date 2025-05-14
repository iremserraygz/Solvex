package quiz_service.model;

import lombok.Data;
import lombok.NoArgsConstructor;

// In com.qs.question_service.model.QuestionWrapper
@Data
@NoArgsConstructor
public class QuestionWrapper {
    private Integer id;
    private String questiontitle; // THIS MUST BE PRESENT
    private String option1;
    private String option2;
    private String option3;
    private String option4;
    private String type; // <-- ADD THIS FIELD
    private String rightanswer; // <-- ADD CORRECT ANSWER (TEMPORARY for review simulation)
    private Integer points;

    public QuestionWrapper(String option4, String option3, String option2, Integer points, String option1, String questiontitle, Integer id, String type, String rightanswer) {
        this.id = id;
        this.questiontitle = questiontitle;
        this.option1 = option1;
        this.option2 = option2;
        this.option3 = option3;
        this.option4 = option4;
        this.type = type;
        this.rightanswer = rightanswer;
       this.points=points;
    }
}

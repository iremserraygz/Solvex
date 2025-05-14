package com.qs.question_service.model;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class QuestionWrapper {
    private Integer id;
    private String questiontitle;
    private String option1;
    private String option2;
    private String option3;
    private String option4;
    private String type;
    private String rightanswer; // <-- ADD CORRECT ANSWER (TEMPORARY for review simulation)
    private Integer points;

    public QuestionWrapper(String option4, String option3, String option2, String option1,Integer points, String questiontitle, Integer id,String type,String rightanswer) {
        this.id = id;
        this.questiontitle = questiontitle;
        this.option1 = option1;
        this.option2 = option2;
        this.option3 = option3;
        this.option4 = option4;
        this.type= type;
        this.rightanswer = rightanswer;
        this.points= points;


    }
}

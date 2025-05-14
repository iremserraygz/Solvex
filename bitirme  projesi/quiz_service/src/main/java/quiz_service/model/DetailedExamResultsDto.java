package quiz_service.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DetailedExamResultsDto {
    private Integer quizId;
    private String quizTitle;
    private Integer totalParticipants;
    private Double averageScorePercentage;
    private Integer passingScore; // Quiz entity'sinden gelen geçme notu (yüzde)
    private List<ScoreDistributionItemDto> scoreDistribution;
    private List<StudentSubmissionResultDto> studentResults;
}
package quiz_service.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExamResultsDto {
    private Integer quizId;
    private String quizTitle;
    private int totalParticipants;
    private Double averageScorePercentage; // Ortalama skor yüzdesi
    private Integer passingScore; // Sınavın geçme notu (Quiz entity'sinden)
    private List<Map<String, Object>> scoreDistribution; // Örn: [{label: "0-20%", value: 5}, ...]
    private List<StudentResultDto> studentResults;
}
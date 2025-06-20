package quiz_service.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ScoreUpdateRequestDto {
    private Integer newTotalAchievedPoints;
    private Map<String, Integer> individualQuestionScores;
}
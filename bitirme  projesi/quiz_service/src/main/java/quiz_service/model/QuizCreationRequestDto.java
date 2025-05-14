package quiz_service.model;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class QuizCreationRequestDto {
    private String title;
    private String description;
    private Integer durationMinutes;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Integer passingScore;
    private List<Integer> questionIds;
}
package quiz_service.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StudentResultDto {
    private Long submissionId;
    private Long userId;
    private String studentIdentifier; // Ad Soyad veya Email olacak
    private LocalDateTime submissionDate;
    private Integer achievedPoints;
    private Integer totalPossiblePoints;
    private String status; // PASSED, FAILED, COMPLETED
}
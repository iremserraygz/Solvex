// quiz_service.model.StudentSubmissionResultDto.java
package quiz_service.model;

import java.time.LocalDateTime;

// ...
public class StudentSubmissionResultDto {
    private Long submissionId;
    private Long userId;
    private String studentFirstName; // YENİ ALAN
    private String studentLastName;  // YENİ ALAN
    private LocalDateTime submissionDate;
    private Integer achievedPoints;
    private Integer totalPossiblePoints;
    private String status;
}
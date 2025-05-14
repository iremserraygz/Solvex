// src/main/java/quiz_service/model/QuizSubmission.java
package quiz_service.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name="quiz_submission", schema = "public")
public class QuizSubmission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "quiz_id", nullable = false)
    private Integer quizId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "achieved_points")
    private Integer achievedPoints;

    @Column(name = "total_possible_points")
    private Integer totalPossiblePoints;

    @Column(name = "submission_date", nullable = false)
    private LocalDateTime submissionDate;

    @Column(name = "submitted_answers_json", columnDefinition = "TEXT")
    private String submittedAnswersJson;

    // --- NEW: Status specific to the student's attempt ---
    @Column(name = "student_status", length = 50) // e.g., "COMPLETED", "PASSED", "FAILED"
    private String studentStatus;
    // --- ---

    // Optional: Quiz relationship (Lazy loaded)
    // @ManyToOne(fetch = FetchType.LAZY)
    // @JoinColumn(name = "quiz_id", insertable = false, updatable = false)
    // private Quiz quiz;
}
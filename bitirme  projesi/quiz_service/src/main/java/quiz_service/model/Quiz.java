package quiz_service.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Data
@Table(name="quiz", schema = "public")
@NoArgsConstructor
@AllArgsConstructor
public class Quiz {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name="id")
    private Integer id;

    private String title;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "quiz_question_ids", joinColumns = @JoinColumn(name = "quiz_id"))
    @Column(name = "question_id")
    private List<Integer> questionIds;

    @Column(name = "status", length = 50)
    private String status;

    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    @Column(name = "start_date")
    private LocalDateTime startDate;

    @Column(name = "end_date")
    private LocalDateTime endDate;

    @Column(name = "passing_score")
    private Integer passingScore;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
}
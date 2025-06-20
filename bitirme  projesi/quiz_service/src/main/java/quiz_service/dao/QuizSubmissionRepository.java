package quiz_service.dao;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import quiz_service.model.QuizSubmission;
import java.util.List;

@Repository
public interface QuizSubmissionRepository extends JpaRepository<QuizSubmission, Long> {
    List<QuizSubmission> findByUserIdOrderBySubmissionDateDesc(Long userId);
    List<QuizSubmission> findByQuizId(Integer quizId); // Sınav sonuçları için
}
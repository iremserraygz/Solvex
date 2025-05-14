package quiz_service.dao;

import org.springframework.stereotype.Repository;
import quiz_service.model.Quiz;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

@Repository
public interface QuizDao extends JpaRepository<Quiz, Integer> {

    List<Quiz> findByStatusIn(List<String> statuses);

    // Method to find quizzes by a single status (needed for history)
    List<Quiz> findByStatus(String status); // Ensure this exists
}
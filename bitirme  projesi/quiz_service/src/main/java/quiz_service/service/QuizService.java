package quiz_service.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.util.UriComponentsBuilder;
import quiz_service.dao.QuizDao;
import quiz_service.dao.QuizSubmissionRepository;
import quiz_service.model.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@Slf4j
public class QuizService {

    private final RestTemplate restTemplate;
    private final QuizDao quizDao;
    private final QuizSubmissionRepository submissionRepository;
    private final ObjectMapper objectMapper;

    private static final String QUESTION_SERVICE_BASE_URL = "http://localhost:8081/question";
    private static final String GENERATE_PATH = "/generate";
    private static final String GET_QUESTIONS_PATH = "/getQuestions";

    @Autowired
    public QuizService(RestTemplate restTemplate, QuizDao quizDao, QuizSubmissionRepository submissionRepository, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.quizDao = quizDao;
        this.submissionRepository = submissionRepository;
        this.objectMapper = objectMapper;
    }

    public ResponseEntity<String> createQuiz(String category, int numQ, String title) {
        log.info("Request to create quiz: category={}, numQ={}, title={}", category, numQ, title);
        if (numQ <= 0) return new ResponseEntity<>("Num questions positive.", HttpStatus.BAD_REQUEST);
        String generateUrl = UriComponentsBuilder.fromHttpUrl(QUESTION_SERVICE_BASE_URL + GENERATE_PATH)
                .queryParam("numQuestions", numQ).queryParam("categoryName", category).toUriString();
        ResponseEntity<List<Integer>> generateResponseEntity;
        try {
            generateResponseEntity = restTemplate.exchange(generateUrl, HttpMethod.POST, null, new ParameterizedTypeReference<>() {});
        } catch (Exception e) {
            log.error("Error from Question Service for URL {}: {}", generateUrl, e.getMessage());
            return new ResponseEntity<>("Error generating questions.", HttpStatus.INTERNAL_SERVER_ERROR);
        }
        if (!generateResponseEntity.getStatusCode().is2xxSuccessful() || generateResponseEntity.getBody() == null) {
            return new ResponseEntity<>("Invalid response from Question Service.", HttpStatus.BAD_GATEWAY);
        }
        List<Integer> questionIds = generateResponseEntity.getBody();
        if (questionIds.isEmpty()) return new ResponseEntity<>("No questions for category.", HttpStatus.NOT_FOUND);

        Quiz quiz = new Quiz();
        quiz.setTitle(title);
        quiz.setQuestionIds(questionIds);
        quiz.setStatus("PUBLISHED");
        quiz.setDurationMinutes(60);
        quiz.setPassingScore(50);
        try {
            Quiz savedQuiz = quizDao.save(quiz);
            return new ResponseEntity<>("Quiz '" + title + "' created. ID: " + savedQuiz.getId(), HttpStatus.CREATED);
        } catch (Exception e) {
            log.error("Error saving quiz '{}'", title, e);
            return new ResponseEntity<>("Error saving quiz.", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Transactional
    public ResponseEntity<Quiz> saveFullQuiz(QuizCreationRequestDto quizDto) {
        log.info("Request to save a full quiz: title={}", quizDto.getTitle());
        if (quizDto.getQuestionIds() == null || quizDto.getQuestionIds().isEmpty()) {
            log.warn("Cannot create quiz '{}' with no questions.", quizDto.getTitle());
            return ResponseEntity.badRequest().body(null);
        }
        if (quizDto.getTitle() == null || quizDto.getTitle().trim().isEmpty()) {
            log.warn("Cannot create quiz with empty title.");
            return ResponseEntity.badRequest().body(null);
        }
        if (quizDto.getDurationMinutes() == null || quizDto.getDurationMinutes() <= 0) {
            log.warn("Quiz duration must be positive for quiz '{}'.", quizDto.getTitle());
            return ResponseEntity.badRequest().body(null);
        }
        if (quizDto.getPassingScore() == null || quizDto.getPassingScore() < 0 || quizDto.getPassingScore() > 100) {
            log.warn("Invalid passing score for quiz '{}'. Must be between 0 and 100.", quizDto.getTitle());
            return ResponseEntity.badRequest().body(null);
        }
        if (quizDto.getStartDate() != null && quizDto.getEndDate() != null && quizDto.getEndDate().isBefore(quizDto.getStartDate())) {
            log.warn("End date cannot be before start date for quiz '{}'.", quizDto.getTitle());
            return ResponseEntity.badRequest().body(null);
        }

        Quiz quiz = new Quiz();
        quiz.setTitle(quizDto.getTitle());
        quiz.setDescription(quizDto.getDescription());
        quiz.setQuestionIds(quizDto.getQuestionIds());
        quiz.setDurationMinutes(quizDto.getDurationMinutes());
        quiz.setStartDate(quizDto.getStartDate());
        quiz.setEndDate(quizDto.getEndDate());
        quiz.setPassingScore(quizDto.getPassingScore());
        quiz.setStatus("PUBLISHED");

        if (quiz.getStartDate() == null && "PUBLISHED".equals(quiz.getStatus())) {
            log.warn("Published quiz '{}' has no start date. It will be considered active immediately if no end date or end date is in future.", quiz.getTitle());
        }

        try {
            Quiz savedQuiz = quizDao.save(quiz);
            log.info("Quiz '{}' saved successfully with ID: {}", savedQuiz.getTitle(), savedQuiz.getId());
            return new ResponseEntity<>(savedQuiz, HttpStatus.CREATED);
        } catch (Exception e) {
            log.error("Error saving quiz '{}'", quizDto.getTitle(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    public ResponseEntity<List<Quiz>> getAllQuizzesForInstructor() {
        log.info("Fetching all quizzes for instructor view.");
        try {
            List<Quiz> quizzes = quizDao.findAll();
            quizzes.sort((q1, q2) -> {
                LocalDateTime d1 = q1.getStartDate() != null ? q1.getStartDate() : LocalDateTime.MIN;
                LocalDateTime d2 = q2.getStartDate() != null ? q2.getStartDate() : LocalDateTime.MIN;
                int dateCompare = d2.compareTo(d1);
                if (dateCompare == 0) {
                    return Integer.compare(q2.getId(), q1.getId());
                }
                return dateCompare;
            });
            return ResponseEntity.ok(quizzes);
        } catch (Exception e) {
            log.error("Error fetching all quizzes for instructor: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Collections.emptyList());
        }
    }

    public ResponseEntity<Quiz> getQuizDetailsById(Integer quizId) {
        log.info("Fetching quiz details for ID: {}", quizId);
        return quizDao.findById(quizId)
                .map(quiz -> {
                    log.info("Quiz found: {}", quiz.getTitle());
                    return ResponseEntity.ok(quiz);
                })
                .orElseGet(() -> {
                    log.warn("Quiz not found with ID: {}", quizId);
                    return ResponseEntity.notFound().build();
                });
    }

    @Transactional
    public ResponseEntity<Quiz> updateQuiz(Integer quizId, QuizCreationRequestDto quizDto) {
        log.info("Request to update quiz ID: {}", quizId);
        Optional<Quiz> existingQuizOpt = quizDao.findById(quizId);
        if (existingQuizOpt.isEmpty()) {
            log.warn("Quiz not found for update with ID: {}", quizId);
            return ResponseEntity.notFound().build();
        }

        Quiz existingQuiz = existingQuizOpt.get();

        if ("ENDED".equalsIgnoreCase(existingQuiz.getStatus())) {
            log.warn("Cannot update an ENDED quiz. ID: {}", quizId);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(null);
        }

        existingQuiz.setTitle(quizDto.getTitle());
        existingQuiz.setDescription(quizDto.getDescription());
        existingQuiz.setDurationMinutes(quizDto.getDurationMinutes());
        existingQuiz.setStartDate(quizDto.getStartDate());
        existingQuiz.setEndDate(quizDto.getEndDate());
        existingQuiz.setPassingScore(quizDto.getPassingScore());

        if (quizDto.getQuestionIds() != null && !quizDto.getQuestionIds().isEmpty()) {
            existingQuiz.setQuestionIds(quizDto.getQuestionIds());
        }
        // Status can be updated e.g., from DRAFT to PUBLISHED.
        // if (quizDto.getStatus() != null) { // If status comes from DTO
        //    existingQuiz.setStatus(quizDto.getStatus());
        // }

        try {
            Quiz updatedQuiz = quizDao.save(existingQuiz);
            log.info("Quiz ID: {} updated successfully.", updatedQuiz.getId());
            return ResponseEntity.ok(updatedQuiz);
        } catch (Exception e) {
            log.error("Error updating quiz ID {}: {}", quizId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @Transactional
    public ResponseEntity<Void> deleteQuiz(Integer quizId) {
        log.info("Request to delete quiz ID: {}", quizId);
        if (!quizDao.existsById(quizId)) {
            log.warn("Quiz not found for deletion with ID: {}", quizId);
            return ResponseEntity.notFound().build();
        }
        Quiz quizToDelete = quizDao.findById(quizId).orElse(null);
        if (quizToDelete != null && "ACTIVE".equalsIgnoreCase(determineCurrentStatus(quizToDelete, LocalDateTime.now()))) {
            log.warn("Cannot delete an ACTIVE quiz. ID: {}", quizId);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        // Consider checking for submissions before deleting
        // boolean hasSubmissions = submissionRepository.existsByQuizId(quizId);
        // if (hasSubmissions) {
        //    log.warn("Cannot delete quiz ID {} because it has submissions.", quizId);
        //    return ResponseEntity.status(HttpStatus.CONFLICT).build();
        // }

        try {
            quizDao.deleteById(quizId);
            log.info("Quiz ID: {} deleted successfully.", quizId);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            log.error("Error deleting quiz ID {}: {}", quizId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    public ResponseEntity<Object> getQuizResults(Integer quizId) {
        log.info("Fetching results for quiz ID: {}", quizId);
        Optional<Quiz> quizOpt = quizDao.findById(quizId);
        if (quizOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Quiz quiz = quizOpt.get();

        List<QuizSubmission> submissions = submissionRepository.findByQuizId(quizId);

        Map<String, Object> results = new HashMap<>();
        results.put("quizId", quiz.getId());
        results.put("quizTitle", quiz.getTitle());
        results.put("totalParticipants", submissions.size());
        results.put("passingScore", quiz.getPassingScore());

        if (!submissions.isEmpty()) {
            double averageScorePercentage = submissions.stream()
                    .filter(s -> s.getAchievedPoints() != null && s.getTotalPossiblePoints() != null && s.getTotalPossiblePoints() > 0)
                    .mapToDouble(s -> (double) s.getAchievedPoints() * 100.0 / s.getTotalPossiblePoints())
                    .average()
                    .orElse(0.0);
            results.put("averageScorePercentage", Math.round(averageScorePercentage * 10.0) / 10.0);

            long passedCount = submissions.stream().filter(s -> "PASSED".equalsIgnoreCase(s.getStudentStatus()) ||
                    (s.getAchievedPoints() != null && quiz.getPassingScore() != null && s.getTotalPossiblePoints() != null && s.getTotalPossiblePoints() > 0 &&
                            (s.getAchievedPoints() * 100.0 / s.getTotalPossiblePoints()) >= quiz.getPassingScore() )).count();
            long failedCount = submissions.size() - passedCount;

            results.put("scoreDistribution", List.of(
                    Map.of("label", "Passed", "value", passedCount),
                    Map.of("label", "Failed", "value", failedCount)
            ));

            List<Map<String, Object>> studentResults = submissions.stream().map(s -> {
                Map<String, Object> sr = new HashMap<>();
                sr.put("userId", s.getUserId());
                sr.put("score", s.getAchievedPoints());
                sr.put("total", s.getTotalPossiblePoints());
                sr.put("status", s.getStudentStatus());
                return sr;
            }).collect(Collectors.toList());
            results.put("studentResults", studentResults);
        } else {
            results.put("averageScorePercentage", 0.0);
            results.put("scoreDistribution", Collections.emptyList());
            results.put("studentResults", Collections.emptyList());
        }
        return ResponseEntity.ok(results);
    }

    public ResponseEntity<QuizSessionDto> getQuizQuestions(Integer quizId) {
        log.info("Fetching quiz session data for quiz ID: {}", quizId);
        Quiz quiz = quizDao.findById(quizId).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Quiz not found with ID: " + quizId));
        if (quiz.getQuestionIds() == null || quiz.getQuestionIds().isEmpty()) {
            log.error("Quiz ID {} has no questions associated.", quizId);
            // Frontend'e boş soru listesi ve uygun bir mesaj döndürmek daha iyi olabilir
            // return new ResponseEntity<>(new QuizSessionDto(quiz.getId(), quiz.getTitle(), quiz.getDurationMinutes(), Collections.emptyList()), HttpStatus.OK);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Quiz has no questions.");
        }
        List<QuestionWrapper> questions = fetchQuestionsData(quiz.getQuestionIds());
        if (questions.isEmpty() && !quiz.getQuestionIds().isEmpty()) {
            log.error("Could not fetch any question details for quiz ID {} even though question IDs exist.", quizId);
            throw new ResponseStatusException(HttpStatus.FAILED_DEPENDENCY, "Could not retrieve question details for the exam.");
        }
        QuizSessionDto sessionDto = new QuizSessionDto(quiz.getId(), quiz.getTitle(), quiz.getDurationMinutes(), questions);
        return ResponseEntity.ok(sessionDto);
    }

    public ResponseEntity<List<QuizInfoDto>> getAvailableQuizzesForStudent(Long userId) {
        log.info("Fetching available quizzes for student ID: {}", userId);
        if (userId == null) return ResponseEntity.badRequest().build();
        try {
            List<String> statuses = Arrays.asList("PUBLISHED", "ACTIVE");
            List<Quiz> candidateQuizzes = quizDao.findByStatusIn(statuses);
            LocalDateTime now = LocalDateTime.now();
            Set<Integer> submittedQuizIds = submissionRepository.findByUserIdOrderBySubmissionDateDesc(userId)
                    .stream().map(QuizSubmission::getQuizId).collect(Collectors.toSet());

            List<QuizInfoDto> dtos = candidateQuizzes.stream()
                    .filter(quiz -> !submittedQuizIds.contains(quiz.getId()))
                    .map(quiz -> {
                        String dynamicStatus = determineCurrentStatus(quiz, now);
                        if ("ACTIVE".equals(dynamicStatus) || "PUBLISHED".equals(dynamicStatus)) {
                            return new QuizInfoDto(
                                    quiz.getId(), quiz.getTitle(), dynamicStatus,
                                    quiz.getDurationMinutes(), quiz.getStartDate(), quiz.getEndDate(),
                                    quiz.getPassingScore());
                        }
                        return null;
                    })
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());
            log.info("Returning {} available quizzes for student {}.", dtos.size(), userId);
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            log.error("Error fetching available quizzes for User ID {}: {}", userId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ArrayList<>());
        }
    }

    @Transactional
    public ResponseEntity<QuizSubmission> calculateResult(Integer quizId, Long userId, List<Response> responses) {
        log.info("Calculating score and saving submission for Quiz ID: {}, User ID: {}", quizId, userId);
        if (responses == null) { // Boş listeye izin ver (kullanıcı hiçbir şeyi işaretlemeyebilir)
            log.warn("Received null responses for quiz ID: {}, User ID: {}. Not saving submission.", quizId, userId);
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }

        Quiz quiz = quizDao.findById(quizId).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Quiz not found with ID: " + quizId));
        List<Integer> questionIds = Optional.ofNullable(quiz.getQuestionIds()).orElse(Collections.emptyList());
        if (questionIds.isEmpty()) {
            log.error("Quiz ID {} has no questions associated.", quizId);
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }

        List<QuestionWrapper> questionsWithData = fetchQuestionsData(questionIds);
        Map<Integer, QuestionWrapper> questionMap = questionsWithData.stream()
                .collect(Collectors.toMap(QuestionWrapper::getId, Function.identity()));

        int achievedPoints = 0;
        int totalPossiblePoints = 0;
        Map<Integer, String> submittedAnswersMap = new HashMap<>();
        for (Response response : responses) {
            if (response != null && response.getId() != null && response.getResponse() != null) {
                submittedAnswersMap.put(response.getId(), response.getResponse());
            } else { log.warn("Skipping invalid response object: {}", response); }
        }

        for (Integer qIdFromQuiz : questionIds) { // Sınavdaki tüm soruları döngüye al
            QuestionWrapper question = questionMap.get(qIdFromQuiz);
            if (question == null) {
                log.warn("Question data not found for ID {} listed in quiz {}. Skipping this question for scoring.", qIdFromQuiz, quizId);
                continue; // Bu soruyu atla
            }
            Integer points = Optional.ofNullable(question.getPoints()).orElse(0);
            totalPossiblePoints += points; // Her zaman toplam puana ekle

            String userAnswer = submittedAnswersMap.get(qIdFromQuiz);
            String correctAnswer = question.getRightanswer();
            if (userAnswer != null && correctAnswer != null &&
                    correctAnswer.trim().equalsIgnoreCase(userAnswer.trim())) {
                achievedPoints += points;
            }
        }


        String submittedAnswersJsonString;
        try {
            submittedAnswersJsonString = objectMapper.writeValueAsString(submittedAnswersMap);
        } catch (JsonProcessingException e) {
            log.error("Error serializing submitted answers for Quiz ID: {}, User ID: {}", quizId, userId, e);
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }

        String studentStatus = "COMPLETED"; // Başlangıç durumu
        Integer passingScore = quiz.getPassingScore();
        if (passingScore != null && totalPossiblePoints > 0) {
            double scorePercentage = ((double) achievedPoints * 100.0) / totalPossiblePoints;
            studentStatus = (scorePercentage >= passingScore) ? "PASSED" : "FAILED";
        }


        QuizSubmission submission = new QuizSubmission(
                null, quizId, userId, achievedPoints, totalPossiblePoints,
                LocalDateTime.now(), submittedAnswersJsonString,
                studentStatus // Hesaplanan durumu ata
        );

        try {
            QuizSubmission savedSubmission = submissionRepository.save(submission);
            log.info("Quiz submission saved. ID: {}, Quiz ID: {}, User ID: {}, Score: {}/{}, Student Status: {}",
                    savedSubmission.getId(), quizId, userId, achievedPoints, totalPossiblePoints, studentStatus);
            return new ResponseEntity<>(savedSubmission, HttpStatus.OK);
        } catch (Exception e) {
            log.error("Error saving quiz submission for Quiz ID: {}, User ID: {}", quizId, userId, e);
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    public ResponseEntity<List<QuizInfoDto>> getExamHistory(Long userId) {
        log.info("Fetching exam history for User ID: {}", userId);
        if (userId == null) {
            log.warn("User ID is null, cannot fetch history.");
            return ResponseEntity.badRequest().build();
        }
        try {
            LocalDateTime now = LocalDateTime.now();
            List<QuizInfoDto> historyDtos = new ArrayList<>();

            List<QuizSubmission> submissions = submissionRepository.findByUserIdOrderBySubmissionDateDesc(userId);
            Set<Integer> submittedQuizIds = new HashSet<>();

            if (!submissions.isEmpty()) {
                List<Integer> quizIdsFromSubmissions = submissions.stream()
                        .map(QuizSubmission::getQuizId)
                        .distinct()
                        .collect(Collectors.toList());

                Map<Integer, Quiz> quizMap = quizDao.findAllById(quizIdsFromSubmissions).stream()
                        .collect(Collectors.toMap(Quiz::getId, Function.identity()));

                for (QuizSubmission submission : submissions) {
                    submittedQuizIds.add(submission.getQuizId());
                    Quiz quiz = quizMap.get(submission.getQuizId());
                    if (quiz == null) {
                        log.warn("Quiz (ID: {}) not found for submission ID: {} (User ID: {}). Skipping.",
                                submission.getQuizId(), submission.getId(), userId);
                        continue;
                    }

                    String studentStatus = submission.getStudentStatus();
                    if (studentStatus == null || "COMPLETED".equalsIgnoreCase(studentStatus)) {
                        Integer passingScore = quiz.getPassingScore();
                        Integer achieved = submission.getAchievedPoints();
                        Integer total = submission.getTotalPossiblePoints();
                        if (passingScore != null && achieved != null && total != null && total > 0) {
                            double scorePercentage = ((double) achieved * 100.0) / total;
                            studentStatus = (scorePercentage >= passingScore) ? "PASSED" : "FAILED";
                        } else {
                            studentStatus = "COMPLETED"; // Veri eksikse veya geçme notu yoksa
                        }
                    }
                    historyDtos.add(new QuizInfoDto(submission, quiz, studentStatus));
                }
            }

            List<String> relevantStatuses = Arrays.asList("PUBLISHED", "ACTIVE", "ENDED");
            List<Quiz> allPotentiallyRelevantQuizzes = quizDao.findByStatusIn(relevantStatuses);

            for (Quiz quiz : allPotentiallyRelevantQuizzes) {
                String dynamicStatus = determineCurrentStatus(quiz, now);

                if ("ENDED".equals(dynamicStatus) && !submittedQuizIds.contains(quiz.getId())) {
                    int quizTotalPoints = 0;
                    if (quiz.getQuestionIds() != null && !quiz.getQuestionIds().isEmpty()) {
                        List<QuestionWrapper> questions = fetchQuestionsData(quiz.getQuestionIds());
                        quizTotalPoints = questions.stream().mapToInt(q -> q.getPoints() != null ? q.getPoints() : 0).sum();
                    }
                    QuizInfoDto unattemptedDto = new QuizInfoDto(quiz, "NOT_ATTEMPTED");
                    unattemptedDto.setTotalPoints(quizTotalPoints);
                    historyDtos.add(unattemptedDto);
                }
            }

            historyDtos.sort((a, b) -> {
                LocalDateTime dateA = a.getDateTaken() != null ? a.getDateTaken() : (a.getEndDate() != null ? a.getEndDate() : LocalDateTime.MIN);
                LocalDateTime dateB = b.getDateTaken() != null ? b.getDateTaken() : (b.getEndDate() != null ? b.getEndDate() : LocalDateTime.MIN);
                return dateB.compareTo(dateA);
            });

            log.info("Returning {} total history entries for User ID: {}", historyDtos.size(), userId);
            return ResponseEntity.ok(historyDtos);
        } catch (Exception e) {
            log.error("Error fetching exam history for User ID: {}", userId, e);
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    public ResponseEntity<QuizReviewDto> getSubmissionDetails(Long submissionId, Long userId) {
        log.info("Fetching submission details for Submission ID: {}, User ID: {}", submissionId, userId);
        if (userId == null) { return ResponseEntity.badRequest().build(); }
        QuizSubmission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Submission not found: " + submissionId));

        if (!submission.getUserId().equals(userId)) {
            log.warn("Forbidden access: User {} to submission {} of user {}", userId, submissionId, submission.getUserId());
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }
        Quiz quiz = quizDao.findById(submission.getQuizId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Associated quiz data missing"));

        List<QuestionWrapper> questionsWithData = fetchQuestionsData(quiz.getQuestionIds());
        Map<Integer, String> userAnswersMap;
        try {
            userAnswersMap = (submission.getSubmittedAnswersJson() != null && !submission.getSubmittedAnswersJson().isEmpty())
                    ? objectMapper.readValue(submission.getSubmittedAnswersJson(), new TypeReference<Map<Integer, String>>() {})
                    : Collections.emptyMap();
        } catch (JsonProcessingException e) {
            log.error("Error deserializing answers for submission ID {}: {}", submissionId, e.getMessage());
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }

        List<QuestionReviewDetailDto> questionDetails = questionsWithData.stream().map(question -> {
            String userAnswer = userAnswersMap.getOrDefault(question.getId(), "");
            String correctAnswer = question.getRightanswer();
            boolean isCorrect = correctAnswer != null && correctAnswer.trim().equalsIgnoreCase(userAnswer.trim());
            List<String> options = null;
            if ("MCQ".equalsIgnoreCase(question.getType())) {
                options = Arrays.asList(question.getOption1(), question.getOption2(), question.getOption3(), question.getOption4())
                        .stream().filter(Objects::nonNull).collect(Collectors.toList());
            }
            return new QuestionReviewDetailDto(
                    question.getId(), question.getQuestiontitle(), question.getType(),
                    question.getPoints(), options, correctAnswer, userAnswer, isCorrect);
        }).collect(Collectors.toList());

        QuizReviewDto reviewDto = new QuizReviewDto(
                submission.getId(), quiz.getId(), quiz.getTitle(), submission.getSubmissionDate(),
                submission.getAchievedPoints(), submission.getTotalPossiblePoints(), questionDetails);
        return ResponseEntity.ok(reviewDto);
    }

    private List<QuestionWrapper> fetchQuestionsData(List<Integer> questionIds) {
        if (questionIds == null || questionIds.isEmpty()) {
            log.warn("fetchQuestionsData called with empty or null questionIds list.");
            return new ArrayList<>();
        }
        String getQuestionsUrl = QUESTION_SERVICE_BASE_URL + GET_QUESTIONS_PATH;
        try {
            ResponseEntity<List<QuestionWrapper>> response = restTemplate.exchange(
                    getQuestionsUrl, HttpMethod.POST, new HttpEntity<>(questionIds),
                    new ParameterizedTypeReference<List<QuestionWrapper>>() {});
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                response.getBody().forEach(q -> { if (q.getPoints() == null) q.setPoints(0); });
                return response.getBody();
            } else {
                log.error("Failed to fetch questions data. Status: {}", response.getStatusCode());
                throw new ResponseStatusException(HttpStatus.FAILED_DEPENDENCY, "Could not fetch question details");
            }
        } catch (Exception e) {
            log.error("Error during fetchQuestionsData for IDs {}: {}", questionIds, e.getMessage(), e);
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Error communicating with Question Service", e);
        }
    }

    private String determineCurrentStatus(Quiz quiz, LocalDateTime now) {
        String instructorSetStatus = quiz.getStatus();
        if ("ENDED".equalsIgnoreCase(instructorSetStatus)) { return "ENDED"; }
        boolean hasEndedByTime = quiz.getEndDate() != null && now.isAfter(quiz.getEndDate());
        if (hasEndedByTime) { return "ENDED"; }
        boolean hasStarted = quiz.getStartDate() == null || !now.isBefore(quiz.getStartDate());
        if ("PUBLISHED".equalsIgnoreCase(instructorSetStatus)) {
            return hasStarted ? "ACTIVE" : "PUBLISHED";
        }
        if("ACTIVE".equalsIgnoreCase(instructorSetStatus)) { // Eğitmen ACTIVE dediyse ve başlamışsa ACTIVE'dir.
            return hasStarted ? "ACTIVE" : "PUBLISHED"; // Başlamadıysa yaklaşan (PUBLISHED) gibi davran.
        }
        // DRAFT vs. gibi diğer durumlar için eğitmenin set ettiği status'u döndür.
        return instructorSetStatus;
    }
}
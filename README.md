# Solvex: Online Exam and Assessment Platform



**Solvex is a comprehensive web application developed with modern technologies, designed to simplify the exam creation, management, and evaluation processes for instructors, while offering students a fair and user-friendly online examination experience.**

This project was developed as a final year project for the software engineering Department.

---

## ✨ Key Features

**For Instructors:**
*   📚 **Detailed Question Pool Management:**
    *   Create various question types (Multiple Choice, True/False, Short Answer).
    *   Manage questions based on category, difficulty level, and points.
    *   Edit and delete existing questions.
*   📝 **Flexible Exam Creation and Management:**
    *   Define exam title, description, duration, start/end dates, and passing score.
    *   Add questions to exams from the question pool or create new ones.
    *   Publish exams, save them as drafts, and update/delete existing exams.
*   📊 **Comprehensive Results Analysis:**
    *   Exam-specific participation and average score statistics.
    *   Score distribution charts.
    *   Review student submissions and view detailed results on a per-student basis.
*   🔐 **Secure User Management:**
    *   Role-based authorization for instructors and students.
    *   Secure account registration and login processes.

**For Students:**
*   💻 **User-Friendly Exam Interface:**
    *   Easily view active and upcoming exams.
    *   Track exam duration with a timer.
    *   Navigate smoothly between questions.
*   📜 **Exam History and Results:**
    *   List of completed exams, scores achieved, and pass/fail status.
*   🧐 **Submission Review:**
    *   Ability to review their own answers and the correct answers.
*   🔑 **Account Security:**
    *   Email verification for account activation.
    *   "Forgot Password" and password reset functionality.

---

## 🚀 Technologies Used

### Backend Architecture: Microservices
Solvex is designed with a microservice architecture for better scalability, maintainability, and independent development cycles.

*   **Auth Service (Login Service):** Responsible for user registration, login, authorization, email verification, and password management.
    *   **Technologies:** Java, Spring Boot, Spring Security, Spring Data JPA, PostgreSQL, Lombok.
*   **Question Service:** Responsible for creating, updating, deleting, listing questions, and managing the question pool.
    *   **Technologies:** Java, Spring Boot, Spring Data JPA, PostgreSQL, Lombok.
*   **Quiz Service:** Responsible for exam creation, publishing, (indirectly) student assignments, receiving submissions, scoring, and results analysis. Communicates with other services via APIs.
    *   **Technologies:** Java, Spring Boot, Spring Data JPA, PostgreSQL, RestTemplate, Lombok.

### Frontend
*   **React (JavaScript):** For developing a dynamic and user-friendly interface.
*   **Axios:** For making HTTP requests to backend services.
*   **HTML5 & CSS3:** For structure and styling.
*   **FontAwesome:** For icons.
*   **Chart.js:** For displaying charts in exam results analysis.

### Database
*   **PostgreSQL:** Relational database for all services.

### Other Tools
*   **Apache Maven:** Project dependency management and build.
*   **Git & GitHub:** Version control system.
*   **IntelliJ IDEA / VS Code:** Development environment.
*   **Postman:** For API testing.
*   **Apache JMeter:** For performance testing.
*   **(If used) Service Discovery (e.g., Eureka):** For services to find each other.
*   **(If used) API Gateway (e.g., Spring Cloud Gateway):** For routing client requests.

---

## 🖼️ Screenshots

*(Add a few key screenshots of your project here. For example:)*

1.  **Instructor Dashboard Overview**
    `[Screenshot Here - e.g., instructor_dashboard.png]`
2.  **Exam Creation Interface**
    `[Screenshot Here - e.g., create_exam.png]`
3.  **Question Pool Management**
    `[Screenshot Here - e.g., question_pool.png]`
4.  **Exam Results Analysis Chart**
    `[Screenshot Here - e.g., exam_results_chart.png]`
5.  **Student Exam Taking Interface**
    `[Screenshot Here - e.g., student_taking_exam.png]`
6.  **Student Exam History**
    `[Screenshot Here - e.g., student_exam_history.png]`

*(You can add images uploaded to GitHub in markdown format like `![Description](path/to/image.png)`)*

---

## ⚙️ Setup and Running the Project

Follow these steps to run the project locally:

### Prerequisites
*   Java Development Kit (JDK) 17 
*   Apache Maven
*   PostgreSQL Database Server
*   Node.js and npm (for Frontend)
*   Git

### Backend Services Setup
The following steps should be applied for each backend service (Auth, Question, Quiz):

1.  **Clone the Project (if you haven't already):**
    ```bash
    git clone https://github.com/yourusername/solvex-project.git
    cd solvex-project/auth-service # (or question-service, quiz-service)
    ```

2.  **Database Configuration:**
    *   Create a separate database in PostgreSQL for each service (e.g., `auth_db`, `question_db`, `quiz_db`).
    *   Update the database connection details (`spring.datasource.url`, `spring.datasource.username`, `spring.datasource.password`) in each service's `src/main/resources/application.properties` (or `.yml`) file according to your PostgreSQL setup.
    *   Ensure `spring.jpa.hibernate.ddl-auto` is set to `update` or `create` (for initial setup).

3.  **Install Dependencies and Build:**
    ```bash
    mvn clean install
    ```

4.  **Run the Service:**
    ```bash
    mvn spring-boot:run
    # Or build the JAR and run it:
    # mvn package
    # java -jar target/auth-service-0.0.1-SNAPSHOT.jar (Check the filename)
    ```
    *Note: For services to communicate (especially Quiz Service with others), if you are not using service discovery (like Eureka), you might need to configure the addresses of other services correctly in their `application.properties` files (e.g., `http://localhost:PORT_NUMBER`).*

### Frontend Setup

1.  **Navigate to the Frontend Directory:**
    ```bash
    cd ../frontend-react-directory # Your frontend project's directory
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Configure API Addresses:**
    Ensure the backend service addresses are correctly configured in your frontend code (usually in `services/authService.js` or an `apiConfig.js` file, e.g., `http://localhost:8080/api/v1` for Auth Service).

4.  **Start the Frontend Application:**
    ```bash
    npm start
    ```
    The application will typically open at `http://localhost:3000`.

---

## 🛠️ API Endpoints (Examples)

*(You can add a few key endpoints from your Postman or Swagger documentation here as examples, or provide a link to your Swagger UI.)*

**Auth Service:**
*   `POST /api/v1/registration` - New user registration
*   `POST /api/v1/login` - User login
*   `POST /api/v1/users/summaries` - Get user summaries by list of IDs

**Question Service:**
*   `GET /question/allQuestions` - List all questions
*   `POST /question/add` - Add a new question

**Quiz Service:**
*   `POST /quiz/save` - Create/publish a new exam
*   `GET /quiz/getQuestions/{quizId}` - Get questions for an exam
*   `POST /quiz/submit/{quizId}` - Submit exam answers

*(For more detailed API documentation, you can visit [Swagger UI Link] - if available.)*

---

## 🚀 Future Work and Enhancements

*   [+] Add more question types (e.g., Matching, Drag & Drop).
*   [ ] Implement advanced exam security features (e.g., proctoring integration, plagiarism detection).
*   [ ] Allow bulk question import for instructors (Excel/CSV format).
*   [ ] Provide more detailed performance feedback and progress tracking for students.
*   [ ] Improve mobile responsiveness and potentially develop a mobile application.
*   [ ] Integrate message queues (RabbitMQ, Kafka) for asynchronous inter-service communication.
*   [ ] Set up CI/CD pipelines for automated testing and deployment.

---

## 🤝 Contributing

While this is a capstone project, potential contributions or feedback are always welcome!

1.  Fork the Project.
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the Branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

---

## 🧑‍💻 Developers

*   **İrem Serra Yağız and Anıl Erdal**
    *   GitHub: [@iremserraygz](https://github.com/iremserraygz)
    *   GitHub: [@anılerdal](https://github.com/Leofia)
    *   LinkedIn: [Your LinkedIn Profile URL](https://linkedin.com/in/irem-serra-ya%C4%9F%C4%B1z-891a95234)
    *   LinkedIn: [Your LinkedIn Profile URL](https://linkedin.com/in/an%C4%B1l-erdal-7b7b98229/)
   




---

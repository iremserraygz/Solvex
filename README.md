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


1.  **Main Page**
   ![image](https://github.com/user-attachments/assets/10ed268c-ee50-465c-a65a-f59d787e569a)
2. **Login Page**
   ![image](https://github.com/user-attachments/assets/c44f6f46-71ee-40cb-b823-c6e3e319434e)
3.  **Create Account Page**
   ![image](https://github.com/user-attachments/assets/a6f32ed6-2d15-49c1-8d68-d012960f0901)
4. **Instructor Dashboard Overview**
   ![image](https://github.com/user-attachments/assets/b2d9f0bf-b914-4943-85bf-680fbab039f4)
5.  **Exam Creation Interface**
    ![image](https://github.com/user-attachments/assets/94b7ed07-e931-4dc5-91fd-c3bedc224c0d)
6.  **Question Pool Management**
    ![image](https://github.com/user-attachments/assets/100f7c94-a627-4521-bf6d-fabdb7fb1896)
7.  **Exam Results Analysis Chart**
    ![image](https://github.com/user-attachments/assets/e00347ec-a92d-40b7-b01a-7ef859dab43f)
8.  **Student Exam Taking Interface**
   ![image](https://github.com/user-attachments/assets/5c57b1cb-8178-40ed-82e9-7b1d3d4046dc)
9.  **Instructor Exam History**
    ![image](https://github.com/user-attachments/assets/accd8db3-9e7e-41be-b9bb-54c661f28940)




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

*   [ ] Add more question types (e.g., Matching, Drag & Drop).
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
🎥 Project Demo
<div align="center"> <a href="https://youtu.be/RDQWWmB0isQ?si=_hC-Ogq3NqcIgJ3r" target="_blank"> <img src="https://img.youtube.com/vi/RDQWWmB0isQ/0.jpg" alt="Watch Solvex Demo Video" width="640" /> <br> ▶️ <strong>Click to Watch the Demo on YouTube</strong> </a> </div>
---

## 🧑‍💻 Developers

*   **İrem Serra Yağız and Anıl Erdal**
    *   GitHub: [@iremserraygz](https://github.com/iremserraygz)
    *   GitHub: [@anılerdal](https://github.com/Leofia)
    *   LinkedIn İrem Serra Yağız: [[(https://linkedin.com/in/irem-serra-ya%C4%9F%C4%B1z-891a95234)]]
    *   LinkedIn Anıl Erdal: [(https://linkedin.com/in/an%C4%B1l-erdal-7b7b98229/]
   




---

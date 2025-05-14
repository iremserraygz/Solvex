// src/main/java/com/qs/question_service/model/Question.java
package com.qs.question_service.model;

import jakarta.persistence.*; // Use jakarta persistence
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data // Lombok annotation for getters, setters, toString, equals, hashCode
@Entity // Specifies that this class is a JPA entity
@NoArgsConstructor // Lombok: Generates a no-argument constructor
@AllArgsConstructor // Lombok: Generates a constructor with all fields
@Table(name="question", schema = "public") // Specifies the table name and schema
public class Question {
    @Id // Marks this field as the primary key
    @GeneratedValue(strategy = GenerationType.IDENTITY) // Configures the ID generation strategy (auto-increment for PostgreSQL)
    @Column(name="id") // Maps this field to the "id" column
    private Integer id;

    @Column(name="questiontitle") // Explicitly map if needed, otherwise Lombok handles it
    private String questiontitle;

    @Column(name="option1")
    private String option1;

    @Column(name="option2")
    private String option2;

    @Column(name="option3")
    private String option3;

    @Column(name="option4")
    private String option4;

    @Column(name="rightanswer")
    private String rightanswer;

    @Column(name="difficultylevel") // Ensure this matches your DB column name if it exists
    private String difficultylevel; // Can be null if not always provided

    @Column(name="category")
    private String category;

    @Column(name="type") // Ensure this matches your DB column name
    private String type; // e.g., "MCQ", "TF", "Short Answer"

    @Column(name="points") // Ensure this matches your DB column name
    private Integer points; // Point value for the question

    // Optional: Add a field for an optional question title/identifier if needed
    @Column(name="title", nullable = true) // Allow null for optional title
    private String title;
}
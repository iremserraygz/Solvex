package com.qs.question_service.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**") // Apply to all endpoints in this service ("/**")
                .allowedOrigins("http://localhost:3000") // Allow requests from your React frontend
                .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS") // Allowed HTTP methods
                .allowedHeaders("*") // Allow all headers (like Content-Type, Authorization)
                .allowCredentials(true) // IMPORTANT: Allow cookies and credentials for session management/login
                .maxAge(3600); // Optional: How long the result of a preflight request can be cached
    }
}
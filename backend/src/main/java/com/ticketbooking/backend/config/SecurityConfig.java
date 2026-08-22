package com.ticketbooking.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthenticationFilter) {

        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http) throws Exception {

        http
                // REST API
                .csrf(csrf -> csrf.disable())

                // CORS - allow frontend requests
                .cors(cors -> {})

                // JWT = stateless
                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )

                .authorizeHttpRequests(auth -> auth

        .requestMatchers(
                "/api/health",
                "/api/auth/**",
                "/actuator/health",
                "/actuator/info"
        ).permitAll()

        .requestMatchers(
                HttpMethod.GET,
                "/api/events",
                "/api/events/**"
        ).permitAll()

        .requestMatchers(
                HttpMethod.POST,
                "/api/events"
        ).authenticated()

        .requestMatchers(
                HttpMethod.PUT,
                "/api/events/**"
        ).authenticated()

        .requestMatchers(
                HttpMethod.DELETE,
                "/api/events/**"
        ).authenticated()

        .requestMatchers(
                "/api/bookings/**"
        ).authenticated()

        .anyRequest().authenticated()
)
                // JWT filter
                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }
}

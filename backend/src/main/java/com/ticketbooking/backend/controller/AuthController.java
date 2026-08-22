package com.ticketbooking.backend.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ticketbooking.backend.entity.User;
import com.ticketbooking.backend.service.JwtService;
import com.ticketbooking.backend.service.UserService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;
    private final JwtService jwtService;

    public AuthController(
            UserService userService,
            JwtService jwtService) {

        this.userService = userService;
        this.jwtService = jwtService;
    }

    // ================= REGISTER =================

    @PostMapping("/register")
    public ResponseEntity<?> register(
            @RequestBody RegisterRequest request) {

        try {

            User user = userService.registerUser(
                    request.name(),
                    request.email(),
                    request.password()
            );

            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(
                            Map.of(
                                    "message",
                                    "User registered successfully",

                                    "id",
                                    user.getId(),

                                    "name",
                                    user.getName(),

                                    "email",
                                    user.getEmail(),

                                    "role",
                                    user.getRole().name()
                            )
                    );

        } catch (RuntimeException e) {

            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(
                            Map.of(
                                    "error",
                                    e.getMessage()
                            )
                    );
        }
    }


    // ================= LOGIN =================

    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestBody LoginRequest request) {

        try {

            User user =
                    userService.loginUser(
                            request.email(),
                            request.password()
                    );

            String token =
                    jwtService.generateToken(user);

            return ResponseEntity.ok(
                    Map.of(
                            "message",
                            "Login successful",

                            "id",
                            user.getId(),

                            "name",
                            user.getName(),

                            "email",
                            user.getEmail(),

                            "role",
                            user.getRole().name(),

                            "token",
                            token
                    )
            );

        } catch (RuntimeException e) {

            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(
                            Map.of(
                                    "error",
                                    e.getMessage()
                            )
                    );
        }
    }
    //--------------auth-----------------
    @PostMapping("/create-organiser")
public ResponseEntity<?> createOrganiser(
        @RequestBody RegisterRequest request) {

    try {

        User user = userService.createOrganiser(
                request.name(),
                request.email(),
                request.password()
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        Map.of(
                                "message", "Organiser created successfully",
                                "id", user.getId(),
                                "name", user.getName(),
                                "email", user.getEmail(),
                                "role", user.getRole().name()
                        )
                );

    } catch (RuntimeException e) {

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(
                        Map.of(
                                "error", e.getMessage()
                        )
                );
    }
}

    // ================= CURRENT USER =================

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(
            Authentication authentication) {

        if (authentication == null ||
                !authentication.isAuthenticated()) {

            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(
                            Map.of(
                                    "error",
                                    "Not authenticated"
                            )
                    );
        }

        try {

            String email =
                    authentication.getName();

            User user =
                    userService.findByEmail(email);

            return ResponseEntity.ok(
                    Map.of(
                            "id",
                            user.getId(),

                            "name",
                            user.getName(),

                            "email",
                            user.getEmail(),

                            "role",
                            user.getRole().name()
                    )
            );

        } catch (RuntimeException e) {

            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(
                            Map.of(
                                    "error",
                                    "User not found"
                            )
                    );
        }
    }

    // ================= REQUEST RECORDS =================

    public record RegisterRequest(
            String name,
            String email,
            String password
    ) {}

    public record LoginRequest(
            String email,
            String password
    ) {}
}

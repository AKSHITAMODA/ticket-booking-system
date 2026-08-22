package com.ticketbooking.backend.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.ticketbooking.backend.entity.User;
import com.ticketbooking.backend.repository.UserRepository;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {

        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // ================= REGISTER =================

    public User registerUser(
            String name,
            String email,
            String password) {

        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException(
                    "Email already registered");
        }

        User user = new User();

        user.setName(name);
        user.setEmail(email);

        // Hash password before storing
        user.setPasswordHash(
                passwordEncoder.encode(password)
        );

        // Normal registration = CUSTOMER
        user.setRole(User.Role.CUSTOMER);

        return userRepository.save(user);
    }

    // ================= LOGIN =================

    public User loginUser(
            String email,
            String password) {

        User user =
                userRepository.findByEmail(email)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Invalid email or password"));

        if (!passwordEncoder.matches(
                password,
                user.getPasswordHash())) {

            throw new RuntimeException(
                    "Invalid email or password");
        }

        return user;
    }

    // -----------NEW ORGANISER-----------------
    public User createOrganiser(
        String name,
        String email,
        String password) {

    if (userRepository.existsByEmail(email)) {
        throw new RuntimeException("Email already registered");
    }

    User user = new User();

    user.setName(name);
    user.setEmail(email);

    user.setPasswordHash(
            passwordEncoder.encode(password)
    );

    user.setRole(User.Role.ORGANISER);

    return userRepository.save(user);
}
    // ================= FIND USER =================

    public User findByEmail(String email) {

        return userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException(
                                "User not found"));
    }

    // ================= JWT USER DETAILS =================

    public UserDetailsData getUserDetailsForJwt(
            String email) {

        User user = findByEmail(email);

        return new UserDetailsData(
                user.getEmail(),
                user.getRole().name()
        );
    }

    public record UserDetailsData(
            String email,
            String role
    ) {}
}

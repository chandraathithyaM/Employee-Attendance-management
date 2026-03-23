package com.employee.management.service;

import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class UltrasonicService {

    private static final String CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int TOKEN_LENGTH = 8;
    private static final int TOKEN_EXPIRY_SECONDS = 120;
    private final SecureRandom random = new SecureRandom();

    // In-memory store for active ultrasonic tokens: token -> expiry time
    private final Map<String, LocalDateTime> activeTokens = new ConcurrentHashMap<>();

    public String generateToken() {
        StringBuilder sb = new StringBuilder(TOKEN_LENGTH);
        for (int i = 0; i < TOKEN_LENGTH; i++) {
            sb.append(CHARS.charAt(random.nextInt(CHARS.length())));
        }
        String token = sb.toString();
        activeTokens.put(token, LocalDateTime.now().plusSeconds(TOKEN_EXPIRY_SECONDS));

        // Clean up expired tokens
        activeTokens.entrySet().removeIf(e -> e.getValue().isBefore(LocalDateTime.now()));

        return token;
    }

    public boolean validateToken(String token) {
        if (token == null || token.isEmpty()) return false;
        LocalDateTime expiry = activeTokens.get(token.toUpperCase());
        if (expiry != null && expiry.isAfter(LocalDateTime.now())) {
            activeTokens.remove(token.toUpperCase());
            return true;
        }
        return false;
    }
}

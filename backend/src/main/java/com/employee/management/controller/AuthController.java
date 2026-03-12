package com.employee.management.controller;

import com.employee.management.dto.AuthResponse;
import com.employee.management.dto.GoogleAuthRequest;
import com.employee.management.model.User;
import com.employee.management.service.GoogleAuthService;
import com.employee.management.service.JwtService;
import com.employee.management.service.UserService;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final GoogleAuthService googleAuthService;
    private final UserService userService;
    private final JwtService jwtService;

    @PostMapping("/google")
    public ResponseEntity<?> googleAuth(@RequestBody GoogleAuthRequest request) {
        GoogleIdToken.Payload payload = googleAuthService.verifyToken(request.getCredential());
        if (payload == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid Google token"));
        }

        String email = payload.getEmail();
        String name = (String) payload.get("name");
        String picture = (String) payload.get("picture");
        String googleId = payload.getSubject();

        User user = userService.findOrCreateUser(email, name, googleId, picture);
        String token = jwtService.generateToken(user.getEmail(), user.getRole().name());

        AuthResponse response = AuthResponse.builder()
                .token(token)
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole())
                .profilePicture(user.getProfilePicture())
                .userId(user.getId())
                .build();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }
        String email = (String) authentication.getPrincipal();
        return userService.findByEmail(email)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}

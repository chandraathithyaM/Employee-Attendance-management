package com.employee.management.service;

import com.employee.management.dto.CreateUserRequest;
import com.employee.management.model.Role;
import com.employee.management.model.User;
import com.employee.management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public User findOrCreateUser(String email, String name, String googleId, String picture) {
        Optional<User> existing = userRepository.findByEmail(email);
        if (existing.isPresent()) {
            User user = existing.get();
            user.setGoogleId(googleId);
            user.setProfilePicture(picture);
            return userRepository.save(user);
        }

        // First user becomes ADMIN automatically
        Role role = userRepository.count() == 0 ? Role.ADMIN : Role.EMPLOYEE;

        User newUser = User.builder()
                .email(email)
                .name(name)
                .googleId(googleId)
                .role(role)
                .profilePicture(picture)
                .joiningDate(LocalDate.now())
                .build();
        return userRepository.save(newUser);
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    public List<User> findAll() {
        return userRepository.findAll();
    }

    public List<User> findByRole(Role role) {
        return userRepository.findByRole(role);
    }

    public User createUser(CreateUserRequest request) {
        User user = User.builder()
                .email(request.getEmail())
                .name(request.getName())
                .role(request.getRole())
                .department(request.getDepartment())
                .phone(request.getPhone())
                .joiningDate(request.getJoiningDate() != null ? request.getJoiningDate() : LocalDate.now())
                .build();
        return userRepository.save(user);
    }

    public User updateUser(Long id, CreateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setRole(request.getRole());
        user.setDepartment(request.getDepartment());
        user.setPhone(request.getPhone());
        if (request.getJoiningDate() != null) {
            user.setJoiningDate(request.getJoiningDate());
        }
        return userRepository.save(user);
    }

    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }
}

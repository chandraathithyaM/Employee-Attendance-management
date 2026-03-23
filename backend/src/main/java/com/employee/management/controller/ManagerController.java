package com.employee.management.controller;

import com.employee.management.dto.AttendanceRequest;
import com.employee.management.dto.CreateUserRequest;
import com.employee.management.dto.LeaveResponse;
import com.employee.management.dto.LocationRequest;
import com.employee.management.model.*;
import com.employee.management.service.*;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/manager")
@RequiredArgsConstructor
public class ManagerController {

    private final UserService userService;
    private final OtpService otpService;
    private final AttendanceService attendanceService;
    private final LeaveService leaveService;
    private final QrCodeService qrCodeService;
    private final UltrasonicService ultrasonicService;

    // ── Profile ──────────────────────────────────────────────────────────────

    @GetMapping("/profile")
    public ResponseEntity<User> getProfile(Authentication authentication) {
        String email = (String) authentication.getPrincipal();
        return userService.findByEmail(email)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ── Employee CRUD ─────────────────────────────────────────────────────────

    @GetMapping("/employees")
    public ResponseEntity<List<User>> getAllEmployees() {
        return ResponseEntity.ok(userService.findByRole(Role.EMPLOYEE));
    }

    @GetMapping("/employees/{id}")
    public ResponseEntity<User> getEmployeeById(@PathVariable Long id) {
        return userService.findById(id)
                .filter(u -> u.getRole() == Role.EMPLOYEE)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/employees")
    public ResponseEntity<User> createEmployee(@RequestBody CreateUserRequest request) {
        request.setRole(Role.EMPLOYEE);
        return ResponseEntity.ok(userService.createUser(request));
    }

    @PutMapping("/employees/{id}")
    public ResponseEntity<User> updateEmployee(@PathVariable Long id, @RequestBody CreateUserRequest request) {
        request.setRole(Role.EMPLOYEE);
        return ResponseEntity.ok(userService.updateUser(id, request));
    }

    @DeleteMapping("/employees/{id}")
    public ResponseEntity<?> deleteEmployee(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok().build();
    }

    // ── Attendance OTP & QR ───────────────────────────────────────────────────

    @PostMapping("/attendance/generate-otp")
    public ResponseEntity<?> generateOtp(@RequestBody LocationRequest location, Authentication authentication, HttpServletRequest request) {
        String email = (String) authentication.getPrincipal();
        User manager = userService.findByEmail(email).orElseThrow();

        VerificationMode mode = parseMode(location.getVerificationMode());
        String ultrasonicToken = null;

        // If ultrasonic mode, generate a token
        if (mode == VerificationMode.ULTRASONIC) {
            ultrasonicToken = ultrasonicService.generateToken();
        }

        OtpRecord otpRecord = otpService.generateOtp(
                manager.getId(),
                location.getLatitude(),
                location.getLongitude(),
                mode,
                getClientIp(request), // Auto IP
                ultrasonicToken
        );

        var response = new java.util.HashMap<String, Object>();
        response.put("otp", otpRecord.getOtp());
        response.put("expiresAt", otpRecord.getExpiresAt().toString());
        response.put("verificationMode", mode.name());
        if (ultrasonicToken != null) {
            response.put("ultrasonicToken", ultrasonicToken);
        }

        return ResponseEntity.ok(response);
    }

    @PostMapping("/attendance/qr")
    public ResponseEntity<?> generateQrCode(@RequestBody LocationRequest location, Authentication authentication, HttpServletRequest request) {
        String email = (String) authentication.getPrincipal();
        User manager = userService.findByEmail(email).orElseThrow();

        VerificationMode mode = parseMode(location.getVerificationMode());
        String ultrasonicToken = null;
        if (mode == VerificationMode.ULTRASONIC) {
            ultrasonicToken = ultrasonicService.generateToken();
        }

        OtpRecord otpRecord = otpService.generateOtp(
                manager.getId(),
                location.getLatitude(),
                location.getLongitude(),
                mode,
                getClientIp(request), // Auto IP
                ultrasonicToken
        );
        String qrBase64 = qrCodeService.generateQrCodeBase64(otpRecord.getOtp());

        var response = new java.util.HashMap<String, Object>();
        response.put("qrCode", qrBase64);
        response.put("otp", otpRecord.getOtp());
        response.put("expiresAt", otpRecord.getExpiresAt().toString());
        response.put("verificationMode", mode.name());
        if (ultrasonicToken != null) {
            response.put("ultrasonicToken", ultrasonicToken);
        }

        return ResponseEntity.ok(response);
    }

    @GetMapping("/attendance/{employeeId}")
    public ResponseEntity<List<Attendance>> getEmployeeAttendance(@PathVariable Long employeeId) {
        return ResponseEntity.ok(attendanceService.getEmployeeAttendance(employeeId));
    }

    // ── Leave Management ──────────────────────────────────────────────────────

    @GetMapping("/leaves")
    public ResponseEntity<List<LeaveResponse>> getAllLeaves() {
        return ResponseEntity.ok(leaveService.getAllLeaves());
    }

    @PutMapping("/leaves/{id}")
    public ResponseEntity<Leave> updateLeaveStatus(
            @PathVariable Long id,
            @RequestParam String status,
            @RequestParam(required = false) String comment,
            Authentication authentication) {
        String email = (String) authentication.getPrincipal();
        User manager = userService.findByEmail(email).orElseThrow();
        return ResponseEntity.ok(leaveService.updateLeaveStatus(id, status, manager.getId(), comment));
    }

    private VerificationMode parseMode(String mode) {
        if (mode == null || mode.isEmpty()) return VerificationMode.LOCATION;
        try {
            return VerificationMode.valueOf(mode.toUpperCase());
        } catch (IllegalArgumentException e) {
            return VerificationMode.LOCATION;
        }
    }

    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("WL-Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        // If multiple IPs are present in X-Forwarded-For, take the first one
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip;
    }
}

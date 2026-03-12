package com.employee.management.controller;

import com.employee.management.dto.AttendanceRequest;
import com.employee.management.dto.CreateUserRequest;
import com.employee.management.dto.LocationRequest;
import com.employee.management.model.*;
import com.employee.management.service.*;
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
    public ResponseEntity<?> generateOtp(@RequestBody LocationRequest location, Authentication authentication) {
        String email = (String) authentication.getPrincipal();
        User manager = userService.findByEmail(email).orElseThrow();
        OtpRecord otpRecord = otpService.generateOtp(manager.getId(), location.getLatitude(), location.getLongitude());
        return ResponseEntity.ok(Map.of(
                "otp", otpRecord.getOtp(),
                "expiresAt", otpRecord.getExpiresAt().toString()
        ));
    }

    @PostMapping("/attendance/qr")
    public ResponseEntity<?> generateQrCode(@RequestBody LocationRequest location, Authentication authentication) {
        String email = (String) authentication.getPrincipal();
        User manager = userService.findByEmail(email).orElseThrow();
        OtpRecord otpRecord = otpService.generateOtp(manager.getId(), location.getLatitude(), location.getLongitude());
        String qrBase64 = qrCodeService.generateQrCodeBase64(otpRecord.getOtp());
        return ResponseEntity.ok(Map.of(
                "qrCode", qrBase64,
                "otp", otpRecord.getOtp(),
                "expiresAt", otpRecord.getExpiresAt().toString()
        ));
    }



    @GetMapping("/attendance/{employeeId}")
    public ResponseEntity<List<Attendance>> getEmployeeAttendance(@PathVariable Long employeeId) {
        return ResponseEntity.ok(attendanceService.getEmployeeAttendance(employeeId));
    }

    // ── Leave Management ──────────────────────────────────────────────────────

    @GetMapping("/leaves")
    public ResponseEntity<List<Leave>> getAllLeaves() {
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
}

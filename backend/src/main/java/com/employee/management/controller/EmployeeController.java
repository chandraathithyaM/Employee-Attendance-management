package com.employee.management.controller;

import com.employee.management.dto.AttendanceRequest;
import com.employee.management.dto.LeaveRequest;
import com.employee.management.model.Attendance;
import com.employee.management.model.AttendanceStatus;
import com.employee.management.model.Leave;
import com.employee.management.model.User;
import com.employee.management.service.AttendanceService;
import com.employee.management.service.LeaveService;
import com.employee.management.service.OtpService;
import com.employee.management.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/employee")
@RequiredArgsConstructor
public class EmployeeController {

    private final UserService userService;
    private final AttendanceService attendanceService;
    private final LeaveService leaveService;
    private final OtpService otpService;

    @GetMapping("/profile")
    public ResponseEntity<User> getProfile(Authentication authentication) {
        String email = (String) authentication.getPrincipal();
        return userService.findByEmail(email)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/attendance")
    public ResponseEntity<List<Attendance>> getMyAttendance(Authentication authentication) {
        String email = (String) authentication.getPrincipal();
        User user = userService.findByEmail(email).orElseThrow();
        return ResponseEntity.ok(attendanceService.getEmployeeAttendance(user.getId()));
    }

    @PostMapping("/attendance/mark")
    public ResponseEntity<?> markAttendance(@RequestBody AttendanceRequest request, Authentication authentication, HttpServletRequest httpRequest) {
        String email = (String) authentication.getPrincipal();
        User employee = userService.findByEmail(email).orElseThrow();

        Optional<Long> managerIdOpt;
        try {
            managerIdOpt = otpService.verifyAnyOtp(
                    request.getOtp(),
                    request.getLatitude(),
                    request.getLongitude(),
                    getClientIp(httpRequest), // Auto IP
                    request.getUltrasonicToken()
            );
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }

        if (managerIdOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid or expired OTP"));
        }

        AttendanceStatus status = AttendanceStatus.valueOf(request.getStatus());
        Attendance attendance = attendanceService.markAttendance(employee.getId(), managerIdOpt.get(), status);
        return ResponseEntity.ok(attendance);
    }

    @PostMapping("/leave")
    public ResponseEntity<Leave> applyLeave(@RequestBody LeaveRequest request, Authentication authentication) {
        String email = (String) authentication.getPrincipal();
        User user = userService.findByEmail(email).orElseThrow();
        return ResponseEntity.ok(leaveService.applyLeave(user.getId(), request));
    }

    @GetMapping("/leave")
    public ResponseEntity<List<Leave>> getMyLeaves(Authentication authentication) {
        String email = (String) authentication.getPrincipal();
        User user = userService.findByEmail(email).orElseThrow();
        return ResponseEntity.ok(leaveService.getLeavesByEmployee(user.getId()));
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
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip;
    }
}

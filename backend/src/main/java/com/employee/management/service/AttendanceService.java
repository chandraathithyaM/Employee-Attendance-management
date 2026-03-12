package com.employee.management.service;

import com.employee.management.model.Attendance;
import com.employee.management.model.AttendanceStatus;
import com.employee.management.repository.AttendanceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;

    public Attendance markAttendance(Long employeeId, Long managerId, AttendanceStatus status) {
        LocalDate today = LocalDate.now();
        Optional<Attendance> existing = attendanceRepository.findByEmployeeIdAndDate(employeeId, today);

        if (existing.isPresent()) {
            Attendance attendance = existing.get();
            attendance.setStatus(status);
            attendance.setMarkedBy(managerId);
            attendance.setOtpVerified(true);
            attendance.setMarkedAt(LocalDateTime.now());
            return attendanceRepository.save(attendance);
        }

        Attendance attendance = Attendance.builder()
                .employeeId(employeeId)
                .date(today)
                .status(status)
                .markedBy(managerId)
                .otpVerified(true)
                .markedAt(LocalDateTime.now())
                .build();
        return attendanceRepository.save(attendance);
    }

    public List<Attendance> getEmployeeAttendance(Long employeeId) {
        return attendanceRepository.findByEmployeeId(employeeId);
    }

    public List<Attendance> getEmployeeAttendanceBetween(Long employeeId, LocalDate start, LocalDate end) {
        return attendanceRepository.findByEmployeeIdAndDateBetween(employeeId, start, end);
    }
}

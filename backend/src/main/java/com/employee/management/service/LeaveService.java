package com.employee.management.service;

import com.employee.management.dto.LeaveRequest;
import com.employee.management.model.Leave;
import com.employee.management.model.LeaveStatus;
import com.employee.management.repository.LeaveRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LeaveService {

    private final LeaveRepository leaveRepository;

    public Leave applyLeave(Long employeeId, LeaveRequest request) {
        Leave leave = Leave.builder()
                .employeeId(employeeId)
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .reason(request.getReason())
                .status(LeaveStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build();
        return leaveRepository.save(leave);
    }

    public List<Leave> getLeavesByEmployee(Long employeeId) {
        return leaveRepository.findByEmployeeIdOrderByCreatedAtDesc(employeeId);
    }

    public List<Leave> getAllLeaves() {
        return leaveRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<Leave> getLeavesByStatus(LeaveStatus status) {
        return leaveRepository.findByStatus(status);
    }

    public Leave updateLeaveStatus(Long leaveId, String statusStr, Long managerId, String comment) {
        Leave leave = leaveRepository.findById(leaveId)
                .orElseThrow(() -> new RuntimeException("Leave not found"));
        leave.setStatus(LeaveStatus.valueOf(statusStr));
        leave.setManagerId(managerId);
        leave.setManagerComment(comment);
        return leaveRepository.save(leave);
    }
}

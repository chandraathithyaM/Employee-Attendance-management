package com.employee.management.service;
import com.employee.management.dto.LeaveRequest;
import com.employee.management.dto.LeaveResponse;
import com.employee.management.model.Leave;
import com.employee.management.model.LeaveStatus;
import com.employee.management.model.User;
import com.employee.management.repository.LeaveRepository;
import com.employee.management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LeaveService {
    private final LeaveRepository leaveRepository;
    private final UserRepository userRepository;

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

    public List<LeaveResponse> getLeavesByEmployee(Long employeeId) {
        return leaveRepository.findByEmployeeIdOrderByCreatedAtDesc(employeeId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<LeaveResponse> getAllLeaves() {
        return leaveRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<LeaveResponse> getLeavesByStatus(LeaveStatus status) {
        return leaveRepository.findByStatus(status)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private LeaveResponse mapToResponse(Leave leave) {
        String employeeName = userRepository.findById(leave.getEmployeeId())
                .map(User::getName)
                .orElse("Unknown Employee");

        return LeaveResponse.builder()
                .id(leave.getId())
                .employeeId(leave.getEmployeeId())
                .employeeName(employeeName)
                .startDate(leave.getStartDate())
                .endDate(leave.getEndDate())
                .reason(leave.getReason())
                .status(leave.getStatus())
                .managerId(leave.getManagerId())
                .createdAt(leave.getCreatedAt())
                .managerComment(leave.getManagerComment())
                .build();
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

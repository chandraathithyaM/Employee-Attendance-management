package com.employee.management.dto;
import com.employee.management.model.LeaveStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeaveResponse {
    private Long id;
    private Long employeeId;
    private String employeeName;
    private LocalDate startDate;
    private LocalDate endDate;
    private String reason;
    private LeaveStatus status;
    private Long managerId;
    private LocalDateTime createdAt;
    private String managerComment;
}

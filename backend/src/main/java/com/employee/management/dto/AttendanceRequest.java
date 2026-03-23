package com.employee.management.dto;

import lombok.Data;

@Data
public class AttendanceRequest {
    private Long employeeId;
    private String otp;
    private String status;
    private Double latitude;
    private Double longitude;
    private String ultrasonicToken;
    private String verificationMode;
}

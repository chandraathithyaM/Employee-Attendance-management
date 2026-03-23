package com.employee.management.dto;

import lombok.Data;

@Data
public class LocationRequest {
    private Double latitude;
    private Double longitude;
    private String verificationMode;
}

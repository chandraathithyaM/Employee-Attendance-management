package com.employee.management.dto;

import com.employee.management.model.Role;
import lombok.Data;

import java.time.LocalDate;

@Data
public class CreateUserRequest {
    private String email;
    private String name;
    private Role role;
    private String department;
    private String phone;
    private LocalDate joiningDate;
}

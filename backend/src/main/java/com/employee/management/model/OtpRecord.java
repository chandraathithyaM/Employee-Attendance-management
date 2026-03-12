package com.employee.management.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "otp_records")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OtpRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String otp;

    @Column(nullable = false)
    private Long managerId;

    private Double latitude;
    private Double longitude;

    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
    private boolean used;
}

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

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    @Builder.Default
    private VerificationMode verificationMode = VerificationMode.LOCATION;

    private String networkId; // Renamed from wifiBssid to store IP or other identifier

    private String ultrasonicToken;

    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
    private boolean used;
}

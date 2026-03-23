package com.employee.management.service;

import com.employee.management.model.OtpRecord;
import com.employee.management.model.VerificationMode;
import com.employee.management.repository.OtpRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class OtpService {

    private final OtpRepository otpRepository;

    private static final int EARTH_RADIUS_METERS = 6371000;

    public OtpRecord generateOtp(Long managerId, Double latitude, Double longitude,
                                  VerificationMode mode, String networkId, String ultrasonicToken) {
        String otp = String.format("%06d", new Random().nextInt(1000000));
        OtpRecord record = OtpRecord.builder()
                .otp(otp)
                .managerId(managerId)
                .latitude(latitude)
                .longitude(longitude)
                .verificationMode(mode != null ? mode : VerificationMode.LOCATION)
                .networkId(networkId) // This stores the manager's IP for WIFI mode
                .ultrasonicToken(ultrasonicToken)
                .createdAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusSeconds(30)) // Valid for 30 seconds
                .used(false)
                .build();
        return otpRepository.save(record);
    }

    public boolean verifyOtp(String otp, Long managerId) {
        Optional<OtpRecord> record = otpRepository.findByOtpAndManagerIdAndUsedFalse(otp, managerId);
        if (record.isPresent() && record.get().getExpiresAt().isAfter(LocalDateTime.now())) {
            OtpRecord otpRecord = record.get();
            otpRecord.setUsed(true);
            otpRepository.save(otpRecord);
            return true;
        }
        return false;
    }

    public Optional<Long> verifyAnyOtp(String otp, Double empLat, Double empLon,
                                        String empNetworkId, String empUltrasonicToken) {
        Optional<OtpRecord> record = otpRepository.findByOtpAndUsedFalse(otp);
        if (record.isPresent() && record.get().getExpiresAt().isAfter(LocalDateTime.now())) {
            OtpRecord otpRecord = record.get();
            
            // Check distance if both manager and employee provided location
            if (otpRecord.getLatitude() != null && otpRecord.getLongitude() != null &&
                empLat != null && empLon != null) {
                double distance = calculateDistance(otpRecord.getLatitude(), otpRecord.getLongitude(), empLat, empLon);
                if (distance > 51.0) {
                    throw new RuntimeException("You are too far from your manager (must be within 50 meters). Distance: " + Math.round(distance) + "m");
                }
            } else if (empLat == null || empLon == null) {
                throw new RuntimeException("Employee location is required to mark attendance.");
            }

            otpRecord.setUsed(true);
            otpRepository.save(otpRecord);
            return Optional.of(otpRecord.getManagerId());
        }
        return Optional.empty();
    }

    private void verifyLocation(OtpRecord otpRecord, Double empLat, Double empLon) {
        if (otpRecord.getLatitude() != null && otpRecord.getLongitude() != null &&
            empLat != null && empLon != null) {
            double distance = calculateDistance(otpRecord.getLatitude(), otpRecord.getLongitude(), empLat, empLon);
            if (distance > 50.0) {
                throw new RuntimeException("You are too far from your manager (must be within 50 meters). Distance: " + Math.round(distance) + "m");
            }
        } else if (empLat == null || empLon == null) {
            throw new RuntimeException("Employee location is required to mark attendance.");
        }
    }

    private void verifyNetwork(OtpRecord otpRecord, String empNetworkId) {
        if (otpRecord.getNetworkId() == null || otpRecord.getNetworkId().isEmpty()) {
            throw new RuntimeException("Manager's network information was not captured properly.");
        }
        if (empNetworkId == null || empNetworkId.isEmpty()) {
            throw new RuntimeException("Network identification failed. Please ensure you are connected to the office network.");
        }
        // IP matching as automatic proxy for same network
        if (!otpRecord.getNetworkId().equals(empNetworkId)) {
            // Note: In local dev at localhost:8080, both may show 127.0.0.1 which will work.
            // On production, it will be the public IP.
            throw new RuntimeException("Network mismatch. You must be on the same local network as your manager.");
        }
    }

    private void verifyUltrasonic(OtpRecord otpRecord, String empUltrasonicToken) {
        if (otpRecord.getUltrasonicToken() == null || otpRecord.getUltrasonicToken().isEmpty()) {
            throw new RuntimeException("No ultrasonic token associated with this session.");
        }
        if (empUltrasonicToken == null || empUltrasonicToken.isEmpty()) {
            throw new RuntimeException("Please capture the ultrasonic signal to mark attendance.");
        }
        if (!otpRecord.getUltrasonicToken().equalsIgnoreCase(empUltrasonicToken.trim())) {
            throw new RuntimeException("Ultrasonic token mismatch. Ensure you are in the same room as your manager.");
        }
    }

    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                   Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                   Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return EARTH_RADIUS_METERS * c;
    }
}

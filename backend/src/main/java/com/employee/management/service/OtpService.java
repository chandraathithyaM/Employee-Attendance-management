package com.employee.management.service;

import com.employee.management.model.OtpRecord;
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

    public OtpRecord generateOtp(Long managerId, Double latitude, Double longitude) {
        String otp = String.format("%06d", new Random().nextInt(1000000));
        OtpRecord record = OtpRecord.builder()
                .otp(otp)
                .managerId(managerId)
                .latitude(latitude)
                .longitude(longitude)
                .createdAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusMinutes(10))
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

    public Optional<Long> verifyAnyOtp(String otp, Double empLat, Double empLon) {
        Optional<OtpRecord> record = otpRepository.findByOtpAndUsedFalse(otp);
        if (record.isPresent() && record.get().getExpiresAt().isAfter(LocalDateTime.now())) {
            OtpRecord otpRecord = record.get();
            
            // Check distance if both manager and employee provided location
            if (otpRecord.getLatitude() != null && otpRecord.getLongitude() != null &&
                empLat != null && empLon != null) {
                double distance = calculateDistance(otpRecord.getLatitude(), otpRecord.getLongitude(), empLat, empLon);
                if (distance > 110.0) {
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

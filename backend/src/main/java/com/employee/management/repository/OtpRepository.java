package com.employee.management.repository;

import com.employee.management.model.OtpRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OtpRepository extends JpaRepository<OtpRecord, Long> {
    Optional<OtpRecord> findByOtpAndManagerIdAndUsedFalse(String otp, Long managerId);
    Optional<OtpRecord> findByOtpAndUsedFalse(String otp);
}

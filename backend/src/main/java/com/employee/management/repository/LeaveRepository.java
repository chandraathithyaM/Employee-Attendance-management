package com.employee.management.repository;

import com.employee.management.model.Leave;
import com.employee.management.model.LeaveStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LeaveRepository extends JpaRepository<Leave, Long> {
    List<Leave> findByEmployeeId(Long employeeId);
    List<Leave> findByStatus(LeaveStatus status);
    List<Leave> findByEmployeeIdOrderByCreatedAtDesc(Long employeeId);
    List<Leave> findAllByOrderByCreatedAtDesc();
}

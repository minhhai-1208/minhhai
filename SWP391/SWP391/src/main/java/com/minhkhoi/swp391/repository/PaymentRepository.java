package com.minhkhoi.swp391.repository;

import com.minhkhoi.swp391.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRepository extends JpaRepository<Payment, Integer> {
}
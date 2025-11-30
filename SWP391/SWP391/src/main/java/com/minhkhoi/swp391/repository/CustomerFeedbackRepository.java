package com.minhkhoi.swp391.repository;

import com.minhkhoi.swp391.entity.CustomerFeedback;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CustomerFeedbackRepository extends JpaRepository<CustomerFeedback, Integer> {
}
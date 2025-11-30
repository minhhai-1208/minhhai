package com.minhkhoi.swp391.repository;

import com.minhkhoi.swp391.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CustomerRepository extends JpaRepository<Customer, Integer> {
}
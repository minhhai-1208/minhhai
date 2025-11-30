package com.minhkhoi.swp391.repository;

import com.minhkhoi.swp391.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderRepository extends JpaRepository<Order, Integer> {
}
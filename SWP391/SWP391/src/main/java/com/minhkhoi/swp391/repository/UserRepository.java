package com.minhkhoi.swp391.repository;

import com.minhkhoi.swp391.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Integer> {
}
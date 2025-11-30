package com.minhkhoi.swp391.repository;

import com.minhkhoi.swp391.entity.VehicleInventory;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VehicleInventoryRepository extends JpaRepository<VehicleInventory, Integer> {
}
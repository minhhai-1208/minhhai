package com.minhkhoi.swp391.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.Nationalized;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.Set;

@Getter
@Setter
@Entity
@Table(name = "Vehicle_Models")
public class VehicleModel {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "model_id", nullable = false)
    private Integer id;

    @Size(max = 20)
    @NotNull
    @Nationalized
    @Column(name = "model_code", nullable = false, length = 20)
    private String modelCode;

    @Size(max = 100)
    @NotNull
    @Nationalized
    @Column(name = "model_name", nullable = false, length = 100)
    private String modelName;

    @Size(max = 50)
    @NotNull
    @Nationalized
    @Column(name = "category", nullable = false, length = 50)
    private String category;

    @NotNull
    @Column(name = "battery_capacity", nullable = false, precision = 5, scale = 2)
    private BigDecimal batteryCapacity;

    @NotNull
    @Column(name = "range_km", nullable = false)
    private Integer rangeKm;

    @NotNull
    @Column(name = "charging_time", nullable = false, precision = 4, scale = 2)
    private BigDecimal chargingTime;

    @NotNull
    @Column(name = "motor_power", nullable = false, precision = 6, scale = 2)
    private BigDecimal motorPower;

    @NotNull
    @Column(name = "seats", nullable = false)
    private Integer seats;

    @Size(max = 20)
    @NotNull
    @Nationalized
    @ColumnDefault("'active'")
    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @NotNull
    @ColumnDefault("getdate()")
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @NotNull
    @ColumnDefault("getdate()")
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @OneToMany(mappedBy = "model")
    private Set<VehicleDetail> vehicleDetails = new LinkedHashSet<>();

    @OneToMany(mappedBy = "model")
    private Set<VehicleVersion> vehicleVersions = new LinkedHashSet<>();

}
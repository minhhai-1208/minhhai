package com.minhkhoi.swp391.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.Nationalized;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.LinkedHashSet;
import java.util.Set;

@Getter
@Setter
@Entity
@Table(name = "Vehicle_Inventory")
public class VehicleInventory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "inventory_id", nullable = false)
    private Integer id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vehicle_detail_id", nullable = false)
    private VehicleDetail vehicleDetail;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dealer_id")
    private Dealer dealer;

    @Size(max = 50)
    @NotNull
    @Nationalized
    @Column(name = "vin_number", nullable = false, length = 50)
    private String vinNumber;

    @Size(max = 50)
    @NotNull
    @Nationalized
    @Column(name = "chassis_number", nullable = false, length = 50)
    private String chassisNumber;

    @Size(max = 50)
    @NotNull
    @Nationalized
    @Column(name = "engine_number", nullable = false, length = 50)
    private String engineNumber;

    @NotNull
    @Column(name = "manufacturing_date", nullable = false)
    private LocalDate manufacturingDate;

    @Size(max = 20)
    @NotNull
    @Nationalized
    @ColumnDefault("'in_stock'")
    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @NotNull
    @Column(name = "wholesale_price", nullable = false, precision = 15, scale = 2)
    private BigDecimal wholesalePrice;

    @NotNull
    @Column(name = "retail_price", nullable = false, precision = 15, scale = 2)
    private BigDecimal retailPrice;

    @Column(name = "received_date")
    private LocalDate receivedDate;

    @Column(name = "sold_date")
    private LocalDate soldDate;

    @OneToMany(mappedBy = "inventory")
    private Set<Order> orders = new LinkedHashSet<>();

    @OneToMany(mappedBy = "inventory")
    private Set<TestDrive> testDrives = new LinkedHashSet<>();

    @OneToMany(mappedBy = "inventory")
    private Set<VehicleDistribution> vehicleDistributions = new LinkedHashSet<>();

}
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
import java.time.LocalDate;
import java.util.LinkedHashSet;
import java.util.Set;

@Getter
@Setter
@Entity
@Table(name = "Dealers")
public class Dealer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "dealer_id", nullable = false)
    private Integer id;

    @Size(max = 20)
    @NotNull
    @Nationalized
    @Column(name = "dealer_code", nullable = false, length = 20)
    private String dealerCode;

    @Size(max = 200)
    @NotNull
    @Nationalized
    @Column(name = "dealer_name", nullable = false, length = 200)
    private String dealerName;

    @Size(max = 500)
    @NotNull
    @Nationalized
    @Column(name = "address", nullable = false, length = 500)
    private String address;

    @Size(max = 100)
    @NotNull
    @Nationalized
    @Column(name = "city", nullable = false, length = 100)
    private String city;

    @Size(max = 100)
    @NotNull
    @Nationalized
    @Column(name = "region", nullable = false, length = 100)
    private String region;

    @Size(max = 100)
    @NotNull
    @Nationalized
    @Column(name = "contact_person", nullable = false, length = 100)
    private String contactPerson;

    @Size(max = 20)
    @NotNull
    @Nationalized
    @Column(name = "phone", nullable = false, length = 20)
    private String phone;

    @Size(max = 100)
    @NotNull
    @Nationalized
    @Column(name = "email", nullable = false, length = 100)
    private String email;

    @NotNull
    @Column(name = "contract_date", nullable = false)
    private LocalDate contractDate;

    @NotNull
    @ColumnDefault("0")
    @Column(name = "sales_target", nullable = false, precision = 15, scale = 2)
    private BigDecimal salesTarget;

    @NotNull
    @ColumnDefault("0")
    @Column(name = "debt_limit", nullable = false, precision = 15, scale = 2)
    private BigDecimal debtLimit;

    @NotNull
    @ColumnDefault("0")
    @Column(name = "current_debt", nullable = false, precision = 15, scale = 2)
    private BigDecimal currentDebt;

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

    @OneToMany(mappedBy = "dealer")
    private Set<Contract> contracts = new LinkedHashSet<>();

    @OneToMany(mappedBy = "dealer")
    private Set<CustomerFeedback> customerFeedbacks = new LinkedHashSet<>();

    @OneToMany(mappedBy = "dealer")
    private Set<Customer> customers = new LinkedHashSet<>();

    @OneToMany(mappedBy = "dealer")
    private Set<Order> orders = new LinkedHashSet<>();

    @OneToMany(mappedBy = "dealer")
    private Set<Promotion> promotions = new LinkedHashSet<>();

    @OneToMany(mappedBy = "dealer")
    private Set<TestDrive> testDrives = new LinkedHashSet<>();

    @OneToMany(mappedBy = "dealer")
    private Set<User> users = new LinkedHashSet<>();

    @OneToMany(mappedBy = "toDealer")
    private Set<VehicleDistribution> vehicleDistributions = new LinkedHashSet<>();

    @OneToMany(mappedBy = "dealer")
    private Set<VehicleInventory> vehicleInventories = new LinkedHashSet<>();

}
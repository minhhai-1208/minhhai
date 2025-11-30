package com.minhkhoi.swp391.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.Nationalized;

import java.util.LinkedHashSet;
import java.util.Set;

@Getter
@Setter
@Entity
@Table(name = "Vehicle_Colors")
public class VehicleColor {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "color_id", nullable = false)
    private Integer id;

    @Size(max = 50)
    @NotNull
    @Nationalized
    @Column(name = "color_name", nullable = false, length = 50)
    private String colorName;

    @Size(max = 20)
    @NotNull
    @Nationalized
    @Column(name = "color_code", nullable = false, length = 20)
    private String colorCode;

    @Size(max = 7)
    @NotNull
    @Nationalized
    @Column(name = "hex_color", nullable = false, length = 7)
    private String hexColor;

    @Size(max = 20)
    @NotNull
    @Nationalized
    @ColumnDefault("'active'")
    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @OneToMany(mappedBy = "color")
    private Set<VehicleDetail> vehicleDetails = new LinkedHashSet<>();

}
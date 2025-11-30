package com.minhkhoi.swp391.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.Nationalized;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "Customer_Feedback")
public class CustomerFeedback {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "feedback_id", nullable = false)
    private Integer id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "dealer_id", nullable = false)
    private Dealer dealer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    private Order order;

    @Size(max = 20)
    @NotNull
    @Nationalized
    @Column(name = "feedback_type", nullable = false, length = 20)
    private String feedbackType;

    @Size(max = 200)
    @NotNull
    @Nationalized
    @Column(name = "subject", nullable = false, length = 200)
    private String subject;

    @Size(max = 2000)
    @NotNull
    @Nationalized
    @Column(name = "description", nullable = false, length = 2000)
    private String description;

    @Size(max = 20)
    @NotNull
    @Nationalized
    @ColumnDefault("'medium'")
    @Column(name = "priority", nullable = false, length = 20)
    private String priority;

    @Size(max = 20)
    @NotNull
    @Nationalized
    @ColumnDefault("'open'")
    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to")
    private User assignedTo;

    @Size(max = 2000)
    @Nationalized
    @Column(name = "resolution_notes", length = 2000)
    private String resolutionNotes;

    @NotNull
    @ColumnDefault("getdate()")
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    @NotNull
    @ColumnDefault("getdate()")
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

}
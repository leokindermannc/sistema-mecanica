package com.garagepro.api.entity;

import com.garagepro.api.entity.enums.PurchaseStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "purchases")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Purchase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String number;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id", nullable = false)
    private Supplier supplier;

    @Column(nullable = false)
    private LocalDate date;

    @Column(name = "total_items", nullable = false)
    @Builder.Default
    private Integer totalItems = 0;

    @Column(name = "total_value", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal totalValue = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private PurchaseStatus status = PurchaseStatus.RASCUNHO;

    @Column(name = "xml_attached", nullable = false)
    @Builder.Default
    private Boolean xmlAttached = false;

    @Column(name = "responsible_user", length = 100)
    private String responsibleUser;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "received_at")
    private LocalDateTime receivedAt;

    @OneToMany(mappedBy = "purchase", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<PurchaseItem> items = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}

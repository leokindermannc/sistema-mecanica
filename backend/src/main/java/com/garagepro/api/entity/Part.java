package com.garagepro.api.entity;

import com.garagepro.api.entity.enums.PartStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "parts")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Part {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "internal_code", nullable = false, unique = true, length = 50)
    private String internalCode;

    @Column(nullable = false, length = 300)
    private String description;

    @Column(name = "manufacturer_code", length = 100)
    private String manufacturerCode;

    @Column(name = "current_stock", nullable = false)
    @Builder.Default
    private Integer currentStock = 0;

    @Column(name = "minimum_stock", nullable = false)
    @Builder.Default
    private Integer minimumStock = 0;

    @Column(name = "average_cost", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal averageCost = BigDecimal.ZERO;

    @Column(name = "sale_price", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal salePrice = BigDecimal.ZERO;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String unit = "UN";

    @Column(length = 100)
    private String category;

    @Column(length = 50)
    private String barcode;

    @Column(length = 100)
    private String location;

    @Column(length = 20)
    private String ncm;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id")
    private Supplier supplier;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private PartStatus status = PartStatus.NORMAL;

    @Column(name = "last_movement_at")
    private LocalDateTime lastMovementAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "part", fetch = FetchType.LAZY)
    @Builder.Default
    private List<StockMovement> movements = new ArrayList<>();

    public void recalculateStatus() {
        if (currentStock <= 0) {
            status = PartStatus.SEM_ESTOQUE;
        } else if (currentStock <= minimumStock) {
            status = PartStatus.BAIXO;
        } else {
            status = PartStatus.NORMAL;
        }
    }

    public void applyWeightedAverageCost(int incomingQty, BigDecimal incomingCost) {
        int totalQty = currentStock + incomingQty;
        if (totalQty > 0) {
            BigDecimal currentTotal = averageCost.multiply(BigDecimal.valueOf(currentStock));
            BigDecimal incomingTotal = incomingCost.multiply(BigDecimal.valueOf(incomingQty));
            averageCost = currentTotal.add(incomingTotal)
                    .divide(BigDecimal.valueOf(totalQty), 2, java.math.RoundingMode.HALF_UP);
        }
    }
}

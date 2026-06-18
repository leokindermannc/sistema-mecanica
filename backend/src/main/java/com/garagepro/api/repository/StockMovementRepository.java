package com.garagepro.api.repository;

import com.garagepro.api.entity.StockMovement;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface StockMovementRepository extends JpaRepository<StockMovement, Long> {
    List<StockMovement> findByPartIdOrderByCreatedAtDesc(Long partId);
    List<StockMovement> findAllByOrderByCreatedAtDesc(Pageable pageable);
}

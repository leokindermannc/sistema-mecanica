package com.garagepro.api.repository;

import com.garagepro.api.entity.Supplier;
import com.garagepro.api.entity.enums.SupplierStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface SupplierRepository extends JpaRepository<Supplier, Long> {
    Optional<Supplier> findByDocument(String document);
    List<Supplier> findByStatusOrderByCorporateNameAsc(SupplierStatus status);
    List<Supplier> findAllByOrderByCorporateNameAsc();
    boolean existsByDocument(String document);
}

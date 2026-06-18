package com.garagepro.api.repository;

import com.garagepro.api.entity.Part;
import com.garagepro.api.entity.enums.PartStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface PartRepository extends JpaRepository<Part, Long> {
    Optional<Part> findByInternalCode(String internalCode);
    Optional<Part> findByManufacturerCode(String manufacturerCode);
    boolean existsByInternalCode(String internalCode);

    @Query("""
        SELECT p FROM Part p
        WHERE (:search IS NULL OR
               LOWER(p.description) LIKE LOWER(CONCAT('%', :search, '%')) OR
               LOWER(p.internalCode) LIKE LOWER(CONCAT('%', :search, '%')) OR
               LOWER(p.manufacturerCode) LIKE LOWER(CONCAT('%', :search, '%')))
          AND (:status IS NULL OR p.status = :status)
          AND (:category IS NULL OR p.category = :category)
        ORDER BY p.description ASC
        """)
    List<Part> search(
        @Param("search") String search,
        @Param("status") PartStatus status,
        @Param("category") String category
    );

    List<Part> findByStatusIn(List<PartStatus> statuses);

    @Query("SELECT DISTINCT p.category FROM Part p WHERE p.category IS NOT NULL ORDER BY p.category ASC")
    List<String> findDistinctCategories();

    @Query("SELECT COUNT(p) FROM Part p WHERE p.status = :status")
    long countByStatus(@Param("status") PartStatus status);
}

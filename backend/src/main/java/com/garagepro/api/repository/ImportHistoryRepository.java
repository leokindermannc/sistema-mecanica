package com.garagepro.api.repository;

import com.garagepro.api.entity.ImportHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ImportHistoryRepository extends JpaRepository<ImportHistory, Long> {
    List<ImportHistory> findAllByOrderByImportedAtDesc();
}

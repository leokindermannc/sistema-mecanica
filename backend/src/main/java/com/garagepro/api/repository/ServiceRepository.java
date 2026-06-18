package com.garagepro.api.repository;

import com.garagepro.api.entity.Service;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ServiceRepository extends JpaRepository<Service, Long> {

    List<Service> findAllByCompanyId(Long companyId);
    boolean existsByNameAndCompanyId(String name, Long companyId);
}

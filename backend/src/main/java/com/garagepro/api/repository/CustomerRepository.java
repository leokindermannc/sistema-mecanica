package com.garagepro.api.repository;

import com.garagepro.api.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CustomerRepository extends JpaRepository<Customer, Long> {

    Optional<Customer> findByDocument(String document);
    boolean existsByDocument(String document);
    List<Customer> findAllByCompanyId(Long companyId);


    
}

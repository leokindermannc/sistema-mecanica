package com.garagepro.api.repository;

import com.garagepro.api.entity.ServiceOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ServiceOrderRepository extends JpaRepository<ServiceOrder, Long>{
    List<ServiceOrder> findAllByCompanyId(Long companyId);
    boolean existsByNumberAndCompanyId(String number, Long companyId);
    
}

package com.garagepro.api.repository;

import com.garagepro.api.entity.ServiceOrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ServiceOrderItemRepository extends JpaRepository<ServiceOrderItem, Long>{
    
}

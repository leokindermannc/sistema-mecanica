package com.garagepro.api.repository;

import com.garagepro.api.entity.ServiceOrderPart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ServiceOrderPartRepository extends JpaRepository<ServiceOrderPart, Long> {
}

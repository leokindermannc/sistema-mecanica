package com.garagepro.api.repository;

import com.garagepro.api.entity.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository 

public interface VehicleRepository extends JpaRepository<Vehicle, Long> {
    
    Optional<Vehicle> findByPlate(String plate);
    List<Vehicle> findAllByCustomerId(Long customerId);
    List<Vehicle> findAllByCompanyId(Long companyId);

}

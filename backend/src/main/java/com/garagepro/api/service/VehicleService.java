package com.garagepro.api.service;

import com.garagepro.api.dto.customer.VehicleRequest;
import com.garagepro.api.dto.customer.VehicleResponse;
import com.garagepro.api.entity.Vehicle;
import com.garagepro.api.repository.CompanyRepository;
import com.garagepro.api.repository.CustomerRepository;
import com.garagepro.api.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor

public class VehicleService {
    private final VehicleRepository vehicleRepository;
    private final CustomerRepository customerRepository;
    private final CompanyRepository companyRepository;

    @Transactional
    public VehicleResponse create(VehicleRequest request, Long customerId, Long companyId){
        var customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Cliente não encontrado"));
        
        var company = companyRepository.findById(companyId)
                .orElseThrow(() -> new RuntimeException("Empresa não encontrada"));

        var vehicle = vehicleRepository.save(Vehicle.builder()
                .plate(request.plate())
                .brand(request.brand())
                .model(request.model())
                .year(request.year())
                .color(request.color())
                .mileage(request.mileage())
                .customer(customer)
                .company(company)
                .build());

        return toResponse(vehicle);
    }

    @Transactional(readOnly = true)
    public List<VehicleResponse> listByCustomer(Long customerId){
        return vehicleRepository.findAllByCustomerId(customerId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public VehicleResponse findById(Long id){
        var vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Veículo não encontrado"));
        return toResponse(vehicle);
    }

    @Transactional
    public VehicleResponse update(Long id, VehicleRequest request){
        var vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Veículo não encontrado"));
        vehicle.setPlate(request.plate());
        vehicle.setBrand(request.brand());
        vehicle.setModel(request.model());
        vehicle.setYear(request.year());
        vehicle.setColor(request.color());
        vehicle.setMileage(request.mileage());

        return toResponse(vehicleRepository.save(vehicle));
    }

    @Transactional
    public void deactivate(Long id){
        var vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Veículo não encontrado"));
        vehicle.setActive(false);
        vehicleRepository.save(vehicle);
    }

    private VehicleResponse toResponse(Vehicle vehicle){
        return new VehicleResponse(
            vehicle.getId(),
            vehicle.getPlate(),
            vehicle.getBrand(),
            vehicle.getModel(),
            vehicle.getYear(),
            vehicle.getColor(),
            vehicle.getMileage(),
            vehicle.getActive(),
            vehicle.getCustomer().getId(),
            vehicle.getCustomer().getName()
        );
    }


}
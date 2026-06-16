package com.garagepro.api.controller;

import com.garagepro.api.dto.customer.CustomerRequest;
import com.garagepro.api.dto.customer.CustomerResponse;
import com.garagepro.api.dto.customer.VehicleRequest;
import com.garagepro.api.dto.customer.VehicleResponse;
import com.garagepro.api.service.CustomerService;
import com.garagepro.api.service.VehicleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customers")
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerService customerService;
    private final VehicleService vehicleService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CustomerResponse create(@Valid @RequestBody CustomerRequest request){
        return customerService.create(request,1L);
    }

    @GetMapping
    public List<CustomerResponse> listAll(){
        return customerService.listAll(1L);
    }

    @GetMapping("/{id}")
    public CustomerResponse findById(@PathVariable Long id) {
        return customerService.findById(id);
    }

    @PutMapping("/{id}")
    public CustomerResponse update(@PathVariable Long id, @Valid @RequestBody CustomerRequest request){
            return customerService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id){
        customerService.deactivate(id);
    }

    @PostMapping("/{customerId}/vehicles")
    @ResponseStatus(HttpStatus.CREATED)
    public VehicleResponse addVehicle(@PathVariable Long customerId, @Valid @RequestBody VehicleRequest request){
        return vehicleService.create(request, customerId, 1L);
    }

    @GetMapping("/{customerId}/vehicles")
    public List<VehicleResponse> listVehicles(@PathVariable Long customerId){
        return vehicleService.listByCustomer(customerId);
    }

    @PutMapping("/{customerId}/vehicles/{vehicleId}")
    public VehicleResponse updateVehicle(@PathVariable Long vehicleId, @Valid @RequestBody VehicleRequest request){
        return vehicleService.update(vehicleId, request);
    }

    @DeleteMapping("/{customerId}/vehicles/{vehicleId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deactivateVehicle(@PathVariable Long vehicleId){
        vehicleService.deactivate(vehicleId);
    }
}

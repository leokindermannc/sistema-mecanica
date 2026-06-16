package com.garagepro.api.controller;

import com.garagepro.api.dto.service.ServiceRequest;
import com.garagepro.api.dto.service.ServiceResponse;
import com.garagepro.api.service.ServiceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/services")
@RequiredArgsConstructor
public class ServiceController {

    private final ServiceService serviceService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ServiceResponse create(@Valid @RequestBody ServiceRequest request) {
        return serviceService.create(request, 1L);
    }

    @GetMapping
    public List<ServiceResponse> listAll() {
        return serviceService.listAll(1L);
    }

    @GetMapping("/{id}")
    public ServiceResponse findById(@PathVariable Long id) {
        return serviceService.findById(id);
    }

    @PutMapping("/{id}")
    public ServiceResponse update(@PathVariable Long id, @Valid @RequestBody ServiceRequest request) {
        return serviceService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deactivate(@PathVariable Long id) {
        serviceService.deactivate(id);
    }
}
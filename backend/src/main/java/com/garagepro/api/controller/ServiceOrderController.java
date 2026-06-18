package com.garagepro.api.controller;

import com.garagepro.api.dto.serviceorder.ServiceOrderRequest;
import com.garagepro.api.dto.serviceorder.ServiceOrderResponse;
import com.garagepro.api.entity.enums.ServiceOrderStatus;
import com.garagepro.api.service.ServiceOrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/service-orders")
@RequiredArgsConstructor
public class ServiceOrderController {

    private final ServiceOrderService serviceOrderService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ServiceOrderResponse create(@Valid @RequestBody ServiceOrderRequest request) {
        return serviceOrderService.create(request, 1L);
    }

    @GetMapping
    public List<ServiceOrderResponse> listAll() {
        return serviceOrderService.listAll(1L);
    }

    @GetMapping("/{id}")
    public ServiceOrderResponse findById(@PathVariable Long id) {
        return serviceOrderService.findById(id);
    }

    @PatchMapping("/{id}/status")
    public ServiceOrderResponse updateStatus(@PathVariable Long id, @RequestParam ServiceOrderStatus status) {
        return serviceOrderService.updateStatus(id, status);
    }
}

package com.garagepro.api.service;

import com.garagepro.api.dto.serviceorder.*;
import com.garagepro.api.entity.*;
import com.garagepro.api.entity.enums.ServiceOrderStatus;
import com.garagepro.api.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ServiceOrderService {

    private final ServiceOrderRepository serviceOrderRepository;
    private final CustomerRepository customerRepository;
    private final VehicleRepository vehicleRepository;
    private final CompanyRepository companyRepository;
    private final ServiceRepository serviceRepository;
    private final PartRepository partRepository;

    @Transactional
    public ServiceOrderResponse create(ServiceOrderRequest request, Long companyId) {
        var company = companyRepository.findById(companyId)
                .orElseThrow(() -> new RuntimeException("Empresa não encontrada"));
        var customer = customerRepository.findById(request.customerId())
                .orElseThrow(() -> new RuntimeException("Cliente não encontrado"));
        var vehicle = vehicleRepository.findById(request.vehicleId())
                .orElseThrow(() -> new RuntimeException("Veículo não encontrado"));

        var serviceOrder = ServiceOrder.builder()
                .number(generateNumber(companyId))
                .status(ServiceOrderStatus.ABERTA)
                .customer(customer)
                .vehicle(vehicle)
                .company(company)
                .notes(request.notes())
                .openedAt(LocalDateTime.now())
                .build();

        BigDecimal totalServices = BigDecimal.ZERO;
        List<ServiceOrderItem> items = new ArrayList<>();

        if (request.items() != null) {
            for (var itemReq : request.items()) {
                var service = serviceRepository.findById(itemReq.serviceId())
                        .orElseThrow(() -> new RuntimeException("Serviço não encontrado: " + itemReq.serviceId()));
                BigDecimal unitPrice = service.getPrice();
                BigDecimal subtotal = unitPrice.multiply(BigDecimal.valueOf(itemReq.quantity()));
                totalServices = totalServices.add(subtotal);
                items.add(ServiceOrderItem.builder()
                        .serviceOrder(serviceOrder)
                        .service(service)
                        .quantity(itemReq.quantity())
                        .unitPrice(unitPrice)
                        .subtotal(subtotal)
                        .build());
            }
        }

        BigDecimal totalParts = BigDecimal.ZERO;
        List<ServiceOrderPart> parts = new ArrayList<>();

        if (request.parts() != null) {
            for (var partReq : request.parts()) {
                var part = partRepository.findById(partReq.partId())
                        .orElseThrow(() -> new RuntimeException("Peça não encontrada: " + partReq.partId()));
                BigDecimal unitPrice = part.getSalePrice();
                BigDecimal subtotal = unitPrice.multiply(BigDecimal.valueOf(partReq.quantity()));
                totalParts = totalParts.add(subtotal);
                parts.add(ServiceOrderPart.builder()
                        .serviceOrder(serviceOrder)
                        .part(part)
                        .quantity(partReq.quantity())
                        .unitPrice(unitPrice)
                        .subtotal(subtotal)
                        .build());
            }
        }

        serviceOrder.setItems(items);
        serviceOrder.setParts(parts);
        serviceOrder.setTotalServices(totalServices);
        serviceOrder.setTotalParts(totalParts);
        serviceOrder.setTotal(totalServices.add(totalParts));

        return toResponse(serviceOrderRepository.save(serviceOrder));
    }

    @Transactional(readOnly = true)
    public List<ServiceOrderResponse> listAll(Long companyId) {
        return serviceOrderRepository.findAllByCompanyId(companyId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ServiceOrderResponse findById(Long id) {
        var serviceOrder = serviceOrderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ordem de Serviço não encontrada"));
        return toResponse(serviceOrder);
    }

    @Transactional
    public ServiceOrderResponse updateStatus(Long id, ServiceOrderStatus newStatus) {
        var serviceOrder = serviceOrderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ordem de Serviço não encontrada"));
        serviceOrder.setStatus(newStatus);
        if (newStatus == ServiceOrderStatus.CONCLUIDA) {
            serviceOrder.setClosedAt(LocalDateTime.now());
        }
        return toResponse(serviceOrderRepository.save(serviceOrder));
    }

    private String generateNumber(Long companyId) {
        long count = serviceOrderRepository.findAllByCompanyId(companyId).size() + 1;
        return String.format("OS-%03d", count);
    }

    private ServiceOrderResponse toResponse(ServiceOrder so) {
        var items = so.getItems().stream()
                .map(item -> new ServiceOrderItemResponse(
                        item.getId(),
                        item.getService().getId(),
                        item.getService().getName(),
                        item.getQuantity(),
                        item.getUnitPrice(),
                        item.getSubtotal()))
                .toList();

        var parts = so.getParts().stream()
                .map(part -> new ServiceOrderPartResponse(
                        part.getId(),
                        part.getPart().getId(),
                        part.getPart().getDescription(),
                        part.getQuantity(),
                        part.getUnitPrice(),
                        part.getSubtotal()))
                .toList();

        return new ServiceOrderResponse(
                so.getId(),
                so.getNumber(),
                so.getStatus(),
                so.getCustomer().getId(),
                so.getCustomer().getName(),
                so.getVehicle().getId(),
                so.getVehicle().getPlate(),
                so.getVehicle().getModel(),
                so.getNotes(),
                so.getTotalServices(),
                so.getTotalParts(),
                so.getTotal(),
                so.getOpenedAt(),
                so.getClosedAt(),
                items,
                parts);
    }
}
package com.garagepro.api.service;

import com.garagepro.api.dto.service.ServiceRequest;
import com.garagepro.api.dto.service.ServiceResponse;
import com.garagepro.api.repository.ServiceRepository;
import com.garagepro.api.repository.CompanyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ServiceService {

    private final ServiceRepository serviceRepository;
    private final CompanyRepository companyRepository;

    @Transactional
    public ServiceResponse create(ServiceRequest request, Long companyId) {
        if (serviceRepository.existsByNameAndCompanyId(request.name(), companyId)) {
            throw new IllegalArgumentException("Já existe um serviço com esse nome");
        }
        var company = companyRepository.findById(companyId)
                .orElseThrow(() -> new RuntimeException("Empresa não encontrada"));

        var service = serviceRepository.save(com.garagepro.api.entity.Service.builder()
                .name(request.name())
                .description(request.description())
                .price(request.price())
                .estimatedMinutes(request.estimatedMinutes())
                .company(company)
                .build());

        return toResponse(service);
    }

    @Transactional(readOnly = true)
    public List<ServiceResponse> listAll(Long companyId) {
        return serviceRepository.findAllByCompanyId(companyId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ServiceResponse findById(Long id) {
        var service = serviceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Serviço não encontrado"));
        return toResponse(service);
    }

    @Transactional
    public ServiceResponse update(Long id, ServiceRequest request) {
        var service = serviceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Serviço não encontrado"));

        service.setName(request.name());
        service.setDescription(request.description());
        service.setPrice(request.price());
        service.setEstimatedMinutes(request.estimatedMinutes());

        return toResponse(serviceRepository.save(service));
    }

    @Transactional
    public void deactivate(Long id) {
        var service = serviceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Serviço não encontrado"));
        service.setActive(false);
        serviceRepository.save(service);
    }

    private ServiceResponse toResponse(com.garagepro.api.entity.Service service) {
        return new ServiceResponse(
                service.getId(),
                service.getName(),
                service.getDescription(),
                service.getPrice(),
                service.getEstimatedMinutes(),
                service.getActive()
        );
    }
}

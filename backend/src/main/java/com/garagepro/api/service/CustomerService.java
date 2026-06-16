package com.garagepro.api.service;

import com.garagepro.api.entity.Customer;
import com.garagepro.api.dto.customer.CustomerRequest;
import com.garagepro.api.dto.customer.CustomerResponse;
import com.garagepro.api.repository.CustomerRepository;
import com.garagepro.api.repository.CompanyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final CompanyRepository companyRepository;

    @Transactional
    public CustomerResponse create(CustomerRequest request, Long companyId){
        if (customerRepository.existsByDocument(request.document())){
            throw new IllegalArgumentException("Documento já cadastrado");
        }
        var company = companyRepository.findById(companyId).orElseThrow(()-> new RuntimeException("Empresa não encontrada"));

        var customer = customerRepository.save(Customer.builder()
                .name(request.name())
                .document(request.document())
                .phone(request.phone())
                .email(request.email())
                .address(request.address())
                .city(request.city())
                .state(request.state())
                .company(company)
                .build()
            );
            return toResponse(customer);
    }

    @Transactional(readOnly = true)
    public List<CustomerResponse> listAll(Long companyId){
        return customerRepository.findAllByCompanyId(companyId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public CustomerResponse findById(Long id){
        var customer = customerRepository.findById(id)
                .orElseThrow(()-> new RuntimeException("Cliente não encontrado"));
                return toResponse(customer);
    }

    @Transactional
    public CustomerResponse update(Long id, CustomerRequest request){
        var customer = customerRepository.findById(id)
                .orElseThrow(()-> new RuntimeException("Cliente não encontrado"));

        customer.setName(request.name());
        customer.setDocument(request.document());
        customer.setPhone(request.phone());
        customer.setEmail(request.email());
        customer.setAddress(request.address());
        customer.setCity(request.city());
        customer.setState(request.state());
        return toResponse(customerRepository.save(customer));
    }
    
    @Transactional
    public void deactivate(Long id) {
        var customer = customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cliente não encontrado"));
        customer.setActive(false);
        customerRepository.save(customer);
    }

    private CustomerResponse toResponse(Customer customer) {
        return new CustomerResponse(
                customer.getId(),
                customer.getName(),
                customer.getDocument(),
                customer.getPhone(),
                customer.getEmail(),
                customer.getAddress(),
                customer.getCity(),
                customer.getState(),
                customer.getActive()
        );
    }

}

package com.collectx.customer.service;

import com.collectx.customer.dto.CustomerRequestDTO;
import com.collectx.customer.dto.CustomerResponseDTO;
import com.collectx.customer.entity.Customer;
import com.collectx.customer.entity.CustomerStatus;
import com.collectx.customer.repository.CustomerRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class CustomerService {

    private static final Logger log = LoggerFactory.getLogger(CustomerService.class);

    @Autowired
    private CustomerRepository customerRepository;

    // ── CREATE ────────────────────────────────────────────────────────────────

    public CustomerResponseDTO create(CustomerRequestDTO dto) {
        log.info("Creating customer name={} email={}", dto.getName(), dto.getEmail());

        if (dto.getEmail() != null && customerRepository.existsByEmail(dto.getEmail())) {
            throw new RuntimeException("Email already registered: " + dto.getEmail());
        }
        if (dto.getPhone() != null && customerRepository.existsByPhone(dto.getPhone())) {
            throw new RuntimeException("Phone already registered: " + dto.getPhone());
        }

        Customer customer = new Customer();
        // customerId is auto-generated — do not set it manually
        customer.setName(dto.getName());
        customer.setEmail(dto.getEmail());
        customer.setPhone(dto.getPhone());
        customer.setAddress(dto.getAddress());
        customer.setCity(dto.getCity());
        customer.setState(dto.getState());
        customer.setPinCode(dto.getPinCode());
        customer.setDateOfBirth(dto.getDateOfBirth() != null ? LocalDate.parse(dto.getDateOfBirth()) : null);
        customer.setConsentSms(dto.getConsentSms()   != null ? dto.getConsentSms()   : true);
        customer.setConsentEmail(dto.getConsentEmail() != null ? dto.getConsentEmail() : true);
        customer.setConsentCall(dto.getConsentCall()  != null ? dto.getConsentCall()  : true);
        customer.setStatus(CustomerStatus.ACTIVE);

        Customer saved = customerRepository.save(customer);
        log.info("Customer created with id={}", saved.getCustomerId());
        return toResponse(saved);
    }

    // ── READ ──────────────────────────────────────────────────────────────────

    public CustomerResponseDTO getById(Long id) {
        log.debug("Fetching customer id={}", id);
        return toResponse(customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found: " + id)));
    }

    public List<CustomerResponseDTO> getAll() {
        log.debug("Fetching all customers");
        return customerRepository.findAll().stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<CustomerResponseDTO> getByStatus(CustomerStatus status) {
        log.debug("Fetching customers with status={}", status);
        return customerRepository.findByStatus(status).stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<CustomerResponseDTO> searchByName(String name) {
        log.debug("Searching customers by name={}", name);
        return customerRepository.findByNameContainingIgnoreCase(name).stream().map(this::toResponse).collect(Collectors.toList());
    }

    public CustomerResponseDTO getByEmail(String email) {
        log.debug("Fetching customer by email={}", email);
        return toResponse(customerRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Customer not found with email: " + email)));
    }

    public CustomerResponseDTO getByPhone(String phone) {
        log.debug("Fetching customer by phone={}", phone);
        return toResponse(customerRepository.findByPhone(phone)
                .orElseThrow(() -> new RuntimeException("Customer not found with phone: " + phone)));
    }

    // ── UPDATE ────────────────────────────────────────────────────────────────

    public CustomerResponseDTO update(Long id, CustomerRequestDTO dto) {
        log.info("Updating customer id={}", id);
        Customer existing = customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found: " + id));

        if (dto.getName()        != null) existing.setName(dto.getName());
        if (dto.getEmail()       != null) existing.setEmail(dto.getEmail());
        if (dto.getPhone()       != null) existing.setPhone(dto.getPhone());
        if (dto.getAddress()     != null) existing.setAddress(dto.getAddress());
        if (dto.getCity()        != null) existing.setCity(dto.getCity());
        if (dto.getState()       != null) existing.setState(dto.getState());
        if (dto.getPinCode()     != null) existing.setPinCode(dto.getPinCode());
        if (dto.getDateOfBirth() != null) existing.setDateOfBirth(LocalDate.parse(dto.getDateOfBirth()));
        if (dto.getStatus()      != null) existing.setStatus(CustomerStatus.valueOf(dto.getStatus()));

        Customer saved = customerRepository.save(existing);
        log.info("Customer updated id={}", saved.getCustomerId());
        return toResponse(saved);
    }

    public CustomerResponseDTO updateConsent(Long id, Map<String, Boolean> consent) {
        log.info("Updating consent for customer id={}", id);
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found: " + id));

        if (consent.containsKey("consentSms"))   customer.setConsentSms(consent.get("consentSms"));
        if (consent.containsKey("consentEmail")) customer.setConsentEmail(consent.get("consentEmail"));
        if (consent.containsKey("consentCall"))  customer.setConsentCall(consent.get("consentCall"));

        return toResponse(customerRepository.save(customer));
    }

    public void updateStatus(Long id, CustomerStatus status) {
        log.info("Updating status for customer id={} to status={}", id, status);
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found: " + id));
        customer.setStatus(status);
        customerRepository.save(customer);
    }

    // ── MAPPER ────────────────────────────────────────────────────────────────

    private CustomerResponseDTO toResponse(Customer c) {
        return CustomerResponseDTO.builder()
                .customerId(c.getCustomerId())
                .name(c.getName())
                .email(c.getEmail())
                .phone(c.getPhone())
                .address(c.getAddress())
                .city(c.getCity())
                .state(c.getState())
                .pinCode(c.getPinCode())
                .dateOfBirth(c.getDateOfBirth() != null ? c.getDateOfBirth().toString() : null)
                .status(c.getStatus() != null ? c.getStatus().name() : null)
                .consentSms(c.getConsentSms())
                .consentEmail(c.getConsentEmail())
                .consentCall(c.getConsentCall())
                .createdAt(c.getCreatedAt() != null ? c.getCreatedAt().toString() : null)
                .updatedAt(c.getUpdatedAt() != null ? c.getUpdatedAt().toString() : null)
                .build();
    }
}

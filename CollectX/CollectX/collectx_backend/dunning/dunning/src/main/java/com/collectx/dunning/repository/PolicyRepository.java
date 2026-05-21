package com.collectx.dunning.repository;

import com.collectx.dunning.entity.ContactPolicy;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PolicyRepository extends JpaRepository<ContactPolicy, Long> {
    Optional<ContactPolicy> findByBucket(String bucket);
}
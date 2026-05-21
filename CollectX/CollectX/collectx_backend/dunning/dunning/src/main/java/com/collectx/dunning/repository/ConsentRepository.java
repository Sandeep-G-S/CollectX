package com.collectx.dunning.repository;

import com.collectx.dunning.entity.ConsentPref;
import com.collectx.dunning.entity.enums.Channel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ConsentRepository extends JpaRepository<ConsentPref, Long> {

    Optional<ConsentPref> findByCustomerIdAndChannel(Long customerId, Channel channel);

    // Used by ConsentsController → list all consents for one customer
    List<ConsentPref> findByCustomerId(Long customerId);
}

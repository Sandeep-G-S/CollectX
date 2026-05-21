package com.collectx.field.repository;

import com.collectx.field.entity.AgencyPlacement;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlacementRepository extends JpaRepository<AgencyPlacement, Long> {}

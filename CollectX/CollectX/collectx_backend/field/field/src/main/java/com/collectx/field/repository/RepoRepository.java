package com.collectx.field.repository;

import com.collectx.field.entity.Repossession;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RepoRepository extends JpaRepository<Repossession, Long> {}


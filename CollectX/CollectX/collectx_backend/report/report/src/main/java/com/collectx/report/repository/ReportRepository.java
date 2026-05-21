package com.collectx.report.repository;

import com.collectx.report.entity.CollectionsReport;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReportRepository extends JpaRepository<CollectionsReport, Long> {}
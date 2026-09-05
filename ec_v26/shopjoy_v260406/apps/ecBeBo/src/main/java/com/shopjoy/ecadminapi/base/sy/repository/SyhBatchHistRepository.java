package com.shopjoy.ecadminapi.base.sy.repository;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyhBatchHist;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyhBatchHistRepository;

public interface SyhBatchHistRepository extends JpaRepository<SyhBatchHist, String>, QSyhBatchHistRepository {
}

package com.shopjoy.ecBeBo.base.sy.repository;

import com.shopjoy.ecBeBo.base.sy.data.entity.SyhBatchHist;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecBeBo.base.sy.repository.qrydsl.QSyhBatchHistRepository;

public interface SyhBatchHistRepository extends JpaRepository<SyhBatchHist, String>, QSyhBatchHistRepository {
}

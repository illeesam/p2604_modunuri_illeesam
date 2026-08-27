package com.shopjoy.ecadminapi.base.ec.od.repository;

import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdDlivItem;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdDlivItemRepository;

import java.util.List;

public interface OdDlivItemRepository extends JpaRepository<OdDlivItem, String>, QOdDlivItemRepository {

    List<OdDlivItem> findByDlivId(String dlivId);
}

package com.shopjoy.ecadminapi.base.ec.pd.repository;

import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdStock;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.QPdProdStockRepository;

import java.util.List;
import java.util.Optional;

public interface PdProdStockRepository extends JpaRepository<PdProdStock, String>, QPdProdStockRepository {

    List<PdProdStock> findBySiteId(String siteId);

    Optional<PdProdStock> findByStockCode(String stockCode);

    Optional<PdProdStock> findByProdId(String prodId);
}

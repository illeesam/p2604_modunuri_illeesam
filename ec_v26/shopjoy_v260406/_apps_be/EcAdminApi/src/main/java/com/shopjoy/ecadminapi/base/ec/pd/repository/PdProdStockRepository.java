package com.shopjoy.ecadminapi.base.ec.pd.repository;

import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdStock;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.QPdProdStockRepository;

/* findByStockCode → QPdProdStockRepository.selectByStockCode
   findByProdId / findByProdIdIn → QPdProdStockRepository.selectList (prodId/prodIds 필터) 로 통합 (2026-08-27)
   findAllByOrderByStockCodeAsc — 호출부 0건 확인 후 제거 (2026-08-27) */
public interface PdProdStockRepository extends JpaRepository<PdProdStock, String>, QPdProdStockRepository {
}

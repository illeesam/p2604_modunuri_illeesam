package com.shopjoy.ecadminapi.base.ec.pd.repository;

import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdOpt;
import org.springframework.data.jpa.repository.JpaRepository;

import com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.QPdProdOptRepository;

/* findByProdId — 호출부 0건 확인 후 제거 (2026-08-27) */
public interface PdProdOptRepository extends JpaRepository<PdProdOpt, String>, QPdProdOptRepository {

    void deleteByProdId(String prodId);
}

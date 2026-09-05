package com.shopjoy.ecadminapi.base.ec.pd.repository;

import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdSku;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.QPdProdSkuRepository;

import java.util.List;

public interface PdProdSkuRepository extends JpaRepository<PdProdSku, String>, QPdProdSkuRepository {
    void deleteByProdId(String prodId);
    List<PdProdSku> findByProdId(String prodId);
}

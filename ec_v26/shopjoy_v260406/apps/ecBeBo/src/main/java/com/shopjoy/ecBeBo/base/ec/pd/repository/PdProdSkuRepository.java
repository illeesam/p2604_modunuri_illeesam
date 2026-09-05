package com.shopjoy.ecBeBo.base.ec.pd.repository;

import com.shopjoy.ecBeBo.base.ec.pd.data.entity.PdProdSku;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecBeBo.base.ec.pd.repository.qrydsl.QPdProdSkuRepository;

import java.util.List;

public interface PdProdSkuRepository extends JpaRepository<PdProdSku, String>, QPdProdSkuRepository {
    void deleteByProdId(String prodId);
    List<PdProdSku> findByProdId(String prodId);
}

package com.shopjoy.ecadminapi.base.ec.pd.repository;

import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdOptType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.QPdProdOptTypeRepository;

public interface PdProdOptTypeRepository extends JpaRepository<PdProdOptType, String>, QPdProdOptTypeRepository {

    List<PdProdOptType> findByProdId(String prodId);

    void deleteByProdId(String prodId);
}

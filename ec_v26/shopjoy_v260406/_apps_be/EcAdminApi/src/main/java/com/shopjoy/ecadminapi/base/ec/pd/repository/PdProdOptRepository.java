package com.shopjoy.ecadminapi.base.ec.pd.repository;

import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdOpt;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.QPdProdOptRepository;

public interface PdProdOptRepository extends JpaRepository<PdProdOpt, String>, QPdProdOptRepository {

    List<PdProdOpt> findByProdOptTypeId(String prodOptTypeId);

    List<PdProdOpt> findByProdId(String prodId);

    void deleteByProdOptTypeIdIn(Collection<String> prodOptTypeIds);

    void deleteByProdId(String prodId);
}

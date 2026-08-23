package com.shopjoy.ecadminapi.base.ec.pd.repository;

import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProd;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.QPdProdRepository;

import java.util.List;

public interface PdProdRepository extends JpaRepository<PdProd, String>, QPdProdRepository {

    @Query("SELECT p FROM PdProd p " +
           "WHERE p.prodStatusCd IN ('DRAFT', 'ACTIVE')")
    List<PdProd> findSyncTargets();
}

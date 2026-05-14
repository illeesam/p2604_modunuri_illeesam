package com.shopjoy.ecadminapi.base.ec.pd.repository;

import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdQna;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.QPdProdQnaRepository;

public interface PdProdQnaRepository extends JpaRepository<PdProdQna, String>, QPdProdQnaRepository {
}

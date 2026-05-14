package com.shopjoy.ecadminapi.base.ec.pd.repository;

import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdImg;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.QPdProdImgRepository;

public interface PdProdImgRepository extends JpaRepository<PdProdImg, String>, QPdProdImgRepository {

    void deleteByProdId(String prodId);
}

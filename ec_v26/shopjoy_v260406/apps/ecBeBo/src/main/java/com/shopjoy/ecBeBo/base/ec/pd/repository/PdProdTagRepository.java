package com.shopjoy.ecadminapi.base.ec.pd.repository;

import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdTag;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.QPdProdTagRepository;

public interface PdProdTagRepository extends JpaRepository<PdProdTag, String>, QPdProdTagRepository {
}

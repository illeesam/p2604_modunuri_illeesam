package com.shopjoy.ecBeBo.base.ec.pd.repository;

import com.shopjoy.ecBeBo.base.ec.pd.data.entity.PdProdRel;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecBeBo.base.ec.pd.repository.qrydsl.QPdProdRelRepository;

public interface PdProdRelRepository extends JpaRepository<PdProdRel, String>, QPdProdRelRepository {
}

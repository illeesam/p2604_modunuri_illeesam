package com.shopjoy.ecBeBo.base.ec.pd.repository;

import com.shopjoy.ecBeBo.base.ec.pd.data.entity.PdTag;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecBeBo.base.ec.pd.repository.qrydsl.QPdTagRepository;

public interface PdTagRepository extends JpaRepository<PdTag, String>, QPdTagRepository {
}

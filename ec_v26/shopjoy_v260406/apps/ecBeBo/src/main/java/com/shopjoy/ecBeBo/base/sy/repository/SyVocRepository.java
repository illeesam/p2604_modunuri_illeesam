package com.shopjoy.ecBeBo.base.sy.repository;

import com.shopjoy.ecBeBo.base.sy.data.entity.SyVoc;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecBeBo.base.sy.repository.qrydsl.QSyVocRepository;

public interface SyVocRepository extends JpaRepository<SyVoc, String>, QSyVocRepository {
}

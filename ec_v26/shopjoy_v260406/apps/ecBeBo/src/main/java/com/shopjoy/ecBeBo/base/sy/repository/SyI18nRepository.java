package com.shopjoy.ecBeBo.base.sy.repository;

import com.shopjoy.ecBeBo.base.sy.data.entity.SyI18n;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecBeBo.base.sy.repository.qrydsl.QSyI18nRepository;

public interface SyI18nRepository extends JpaRepository<SyI18n, String>, QSyI18nRepository {
}

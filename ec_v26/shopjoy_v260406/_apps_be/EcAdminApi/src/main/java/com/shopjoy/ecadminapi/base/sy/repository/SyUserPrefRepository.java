package com.shopjoy.ecadminapi.base.sy.repository;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyUserPref;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyUserPrefRepository;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SyUserPrefRepository extends JpaRepository<SyUserPref, SyUserPref.SyUserPrefId>, QSyUserPrefRepository {
}

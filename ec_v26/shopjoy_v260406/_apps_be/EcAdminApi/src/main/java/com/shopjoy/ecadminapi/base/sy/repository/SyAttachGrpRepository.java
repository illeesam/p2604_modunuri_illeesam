package com.shopjoy.ecadminapi.base.sy.repository;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyAttachGrp;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyAttachGrpRepository;

public interface SyAttachGrpRepository extends JpaRepository<SyAttachGrp, String>, QSyAttachGrpRepository {
}

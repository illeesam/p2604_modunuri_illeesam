package com.shopjoy.ecadminapi.base.sy.repository;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyAttach;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyAttachRepository;

public interface SyAttachRepository extends JpaRepository<SyAttach, String>, QSyAttachRepository {
}

package com.shopjoy.ecadminapi.base.ec.cm.repository;

import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmPath;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.QCmPathRepository;

public interface CmPathRepository extends JpaRepository<CmPath, String>, QCmPathRepository {
}

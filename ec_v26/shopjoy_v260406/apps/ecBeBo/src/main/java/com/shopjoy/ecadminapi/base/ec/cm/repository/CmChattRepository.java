package com.shopjoy.ecadminapi.base.ec.cm.repository;

import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmChatt;
import com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.QCmChattRepository;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CmChattRepository extends JpaRepository<CmChatt, String>, QCmChattRepository {
}

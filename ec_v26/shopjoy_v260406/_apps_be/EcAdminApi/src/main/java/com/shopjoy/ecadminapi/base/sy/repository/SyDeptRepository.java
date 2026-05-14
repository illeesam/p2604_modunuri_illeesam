package com.shopjoy.ecadminapi.base.sy.repository;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyDept;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyDeptRepository;

public interface SyDeptRepository extends JpaRepository<SyDept, String>, QSyDeptRepository {
}

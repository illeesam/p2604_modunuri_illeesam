package com.shopjoy.ecadminapi.base.sy.repository;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyUser;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyUserRepository;

public interface SyUserRepository extends JpaRepository<SyUser, String>, QSyUserRepository {
    /* dept-counts 메서드는 QSyUserRepository(impl)로 이동 — 동적 native SQL */
}

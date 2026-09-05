package com.shopjoy.ecadminapi.base.ec.mb.repository;

import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMemberRole;
import org.springframework.data.jpa.repository.JpaRepository;

import com.shopjoy.ecadminapi.base.ec.mb.repository.qrydsl.QMbMemberRoleRepository;

/* findByMemberId — 호출부 0건 확인 후 제거 (2026-08-27) */
public interface MbMemberRoleRepository extends JpaRepository<MbMemberRole, String>, QMbMemberRoleRepository {
}

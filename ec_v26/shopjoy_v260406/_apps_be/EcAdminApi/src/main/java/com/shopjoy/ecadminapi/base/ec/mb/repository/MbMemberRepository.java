package com.shopjoy.ecadminapi.base.ec.mb.repository;

import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.base.ec.mb.repository.qrydsl.QMbMemberRepository;

public interface MbMemberRepository extends JpaRepository<MbMember, String>, QMbMemberRepository {

    Optional<MbMember> findByLoginId(String loginId);

    /**
     * 등급 재산정 대상 회원 조회 — ACTIVE 상태 + 사이트별.
     * SUSPENDED / WITHDRAWN 회원은 등급 재산정 제외.
     */
    @Query("SELECT m FROM MbMember m " +
           "WHERE m.siteId = :siteId " +
           "AND m.memberStatusCd = 'ACTIVE'")
    List<MbMember> findActiveForGradeCalc(@Param("siteId") String siteId);
}

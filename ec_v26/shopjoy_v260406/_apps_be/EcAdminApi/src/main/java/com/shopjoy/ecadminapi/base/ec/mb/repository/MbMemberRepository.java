package com.shopjoy.ecadminapi.base.ec.mb.repository;

import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
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

    /**
     * 휴면 예정 이메일 대상 조회 — ACTIVE 상태 + 마지막 로그인이 warnThreshold ~ dormantThreshold 사이인 회원.
     * (lastLogin <= warnThreshold) AND (lastLogin > dormantThreshold)
     * → 이미 휴면 기준(365일)을 넘은 회원은 제외(별도 처리).
     */
    @Query("SELECT m FROM MbMember m " +
           "WHERE m.siteId = :siteId " +
           "AND m.memberStatusCd = 'ACTIVE' " +
           "AND m.lastLogin <= :warnThreshold " +
           "AND m.lastLogin > :dormantThreshold")
    List<MbMember> findDormantWarnTargets(
        @Param("siteId") String siteId,
        @Param("warnThreshold") LocalDateTime warnThreshold,
        @Param("dormantThreshold") LocalDateTime dormantThreshold
    );

    /**
     * 휴면 전환 대상 조회 — ACTIVE 상태 + 마지막 로그인이 threshold 이전인 회원.
     * lastLogin IS NULL(가입 후 미로그인)인 경우도 regDate 기준으로 threshold 경과 시 대상에 포함.
     */
    @Query("SELECT m FROM MbMember m " +
           "WHERE m.siteId = :siteId " +
           "AND m.memberStatusCd = 'ACTIVE' " +
           "AND (m.lastLogin <= :threshold OR " +
           "     (m.lastLogin IS NULL AND m.regDate <= :threshold))")
    List<MbMember> findDormantTargets(
        @Param("siteId") String siteId,
        @Param("threshold") LocalDateTime threshold
    );
}

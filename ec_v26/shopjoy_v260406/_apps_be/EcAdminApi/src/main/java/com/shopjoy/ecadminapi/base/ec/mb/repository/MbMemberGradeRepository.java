package com.shopjoy.ecadminapi.base.ec.mb.repository;

import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMemberGrade;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.shopjoy.ecadminapi.base.ec.mb.repository.qrydsl.QMbMemberGradeRepository;

import java.util.List;

public interface MbMemberGradeRepository extends JpaRepository<MbMemberGrade, String>, QMbMemberGradeRepository {

    /**
     * 사이트별 활성 등급 목록 — grade_rank 내림차순 (높은 등급 먼저).
     * 등급 재산정 시 순서대로 순회하여 첫 번째로 조건을 만족하는 등급이 목표 등급.
     */
    @Query("SELECT g FROM MbMemberGrade g " +
           "WHERE g.siteId = :siteId AND g.useYn = 'Y' " +
           "ORDER BY g.gradeRank DESC")
    List<MbMemberGrade> findActiveBySiteIdOrderByRankDesc(@Param("siteId") String siteId);
}

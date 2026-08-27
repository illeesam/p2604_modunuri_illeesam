package com.shopjoy.ecadminapi.base.ec.mb.repository;

import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMemberGrade;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.ec.mb.repository.qrydsl.QMbMemberGradeRepository;

import java.util.List;

public interface MbMemberGradeRepository extends JpaRepository<MbMemberGrade, String>, QMbMemberGradeRepository {

    /** 활성 등급 목록 — gradeRank 내림차순 */
    List<MbMemberGrade> findByUseYnOrderByGradeRankDesc(String useYn);
}

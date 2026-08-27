package com.shopjoy.ecadminapi.base.ec.mb.repository;

import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMemberGrade;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.ec.mb.repository.qrydsl.QMbMemberGradeRepository;

/* findActiveOrderByRankDesc → QMbMemberGradeRepository.selectActiveOrderByRankDesc 로 전환 (2026-08-27) */
public interface MbMemberGradeRepository extends JpaRepository<MbMemberGrade, String>, QMbMemberGradeRepository {
}

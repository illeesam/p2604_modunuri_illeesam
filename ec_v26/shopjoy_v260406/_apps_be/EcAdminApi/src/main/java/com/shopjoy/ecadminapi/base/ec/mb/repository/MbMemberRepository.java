package com.shopjoy.ecadminapi.base.ec.mb.repository;

import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMember;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.ec.mb.repository.qrydsl.QMbMemberRepository;

/* findByLoginId → QMbMemberRepository.selectByLoginId
   findDistinctSiteIds → selectDistinctSiteIds
   findActiveForGradeCalc → selectActiveForGradeCalc
   findDormantWarnTargets → selectDormantWarnTargets
   findDormantTargets → selectDormantTargets 로 전환 (2026-08-27) */
public interface MbMemberRepository extends JpaRepository<MbMember, String>, QMbMemberRepository {
}

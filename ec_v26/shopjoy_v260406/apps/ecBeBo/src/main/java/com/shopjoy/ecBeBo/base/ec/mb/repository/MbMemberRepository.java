package com.shopjoy.ecBeBo.base.ec.mb.repository;

import com.shopjoy.ecBeBo.base.ec.mb.data.entity.MbMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import com.shopjoy.ecBeBo.base.ec.mb.repository.qrydsl.QMbMemberRepository;

/* findDistinctSiteIds(단일컬럼 DISTINCT 투영), findDormantTargets(AND 안에 OR 그룹),
   findDormantWarnTargets(파라미터 3개) 는 Query Method 로 표현 불가 → QMbMemberRepository (QueryDSL) 사용 */
public interface MbMemberRepository extends JpaRepository<MbMember, String>, QMbMemberRepository {

    Optional<MbMember> findByLoginId(String loginId);

    /**
     * 등급 재산정 대상 회원 조회 — ACTIVE 상태 + 사이트별.
     * SUSPENDED / WITHDRAWN 회원은 등급 재산정 제외.
     */
    List<MbMember> findByMemberStatusCd(String memberStatusCd);
}

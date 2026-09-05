package com.shopjoy.ecBeBo.base.sy.repository;

import com.shopjoy.ecBeBo.base.sy.data.entity.SyUserPref;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/* QueryDSL 없이 파생 쿼리로 충분 (단순 단일테이블 조회, 2026-08-27) */
public interface SyUserPrefRepository extends JpaRepository<SyUserPref, String> {

    /** userId 기준 전체 개인화 설정 조회 */
    List<SyUserPref> findByUserIdOrderByPrefKeyAsc(String userId);

    /** (userId, prefKey) 복합 UNIQUE 단건 조회 */
    Optional<SyUserPref> findByUserIdAndPrefKey(String userId, String prefKey);
}

package com.shopjoy.ecBeBo.md.cb.repository;

import com.shopjoy.ecBeBo.md.cb.data.entity.MdCbPatternYarn;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/* QueryDSL 없이 파생 쿼리로 충분 (단순 단일테이블 조회, 2026-08-27) */
public interface MdCbPatternYarnRepository extends JpaRepository<MdCbPatternYarn, String> {

    List<MdCbPatternYarn> findByPatternIdOrderByRegDateAsc(String patternId);

    long deleteByPatternId(String patternId);
}

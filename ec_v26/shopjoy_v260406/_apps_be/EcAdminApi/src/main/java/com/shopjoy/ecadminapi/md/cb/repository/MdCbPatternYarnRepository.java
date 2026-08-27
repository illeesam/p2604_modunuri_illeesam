package com.shopjoy.ecadminapi.md.cb.repository;

import com.shopjoy.ecadminapi.md.cb.data.entity.MdCbPatternYarn;
import com.shopjoy.ecadminapi.md.cb.repository.qrydsl.QMdCbPatternYarnRepository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/* findByPatternIdOrderByRegDateAsc → QMdCbPatternYarnRepository.selectListByPatternId 로 전환 (2026-08-27) */
public interface MdCbPatternYarnRepository extends JpaRepository<MdCbPatternYarn, String>, QMdCbPatternYarnRepository {

    @Modifying
    @Query("DELETE FROM MdCbPatternYarn y WHERE y.patternId = :patternId")
    int deleteByPatternId(@Param("patternId") String patternId);
}

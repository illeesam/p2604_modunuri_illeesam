package com.shopjoy.ecadminapi.md.cb.repository;

import com.shopjoy.ecadminapi.md.cb.data.entity.MdCbPatternCell;
import com.shopjoy.ecadminapi.md.cb.repository.qrydsl.QMdCbPatternCellRepository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/* findByPatternIdOrderByRowNoAscColNoAsc → QMdCbPatternCellRepository.selectListByPatternId 로 전환 (2026-08-27) */
public interface MdCbPatternCellRepository extends JpaRepository<MdCbPatternCell, String>, QMdCbPatternCellRepository {

    @Modifying
    @Query("DELETE FROM MdCbPatternCell c WHERE c.patternId = :patternId")
    int deleteByPatternId(@Param("patternId") String patternId);
}

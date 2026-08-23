package com.shopjoy.ecadminapi.md.cb.repository;

import com.shopjoy.ecadminapi.md.cb.data.entity.MdCbPatternCell;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

/** MdCbPatternCell — 순수 자식 컬렉션(도안 격자)이라 QueryDSL 없이 파생 쿼리로 충분 */
public interface MdCbPatternCellRepository extends JpaRepository<MdCbPatternCell, String> {

    List<MdCbPatternCell> findByPatternIdOrderByRowNoAscColNoAsc(String patternId);

    @Modifying
    @Query("DELETE FROM MdCbPatternCell c WHERE c.patternId = :patternId")
    int deleteByPatternId(@Param("patternId") String patternId);
}

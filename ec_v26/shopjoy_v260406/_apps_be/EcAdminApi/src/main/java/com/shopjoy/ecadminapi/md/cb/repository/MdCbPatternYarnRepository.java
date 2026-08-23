package com.shopjoy.ecadminapi.md.cb.repository;

import com.shopjoy.ecadminapi.md.cb.data.entity.MdCbPatternYarn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

/** MdCbPatternYarn — 순수 자식 컬렉션(도안-실 매핑)이라 QueryDSL 없이 파생 쿼리로 충분 */
public interface MdCbPatternYarnRepository extends JpaRepository<MdCbPatternYarn, String> {

    List<MdCbPatternYarn> findByPatternIdOrderByRegDateAsc(String patternId);

    @Modifying
    @Query("DELETE FROM MdCbPatternYarn y WHERE y.patternId = :patternId")
    int deleteByPatternId(@Param("patternId") String patternId);
}

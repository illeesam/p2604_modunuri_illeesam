package com.shopjoy.ecadminapi.md.sg.repository;

import com.shopjoy.ecadminapi.md.sg.data.entity.MdSgSourcegenHist;
import com.shopjoy.ecadminapi.md.sg.repository.qrydsl.QMdSgSourcegenHistRepository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

/** MdSgSourcegenHist — 프로젝트별 생성 이력(최신순). 단순 조회라 QueryDSL 없이 파생 쿼리로 충분 */
public interface MdSgSourcegenHistRepository extends JpaRepository<MdSgSourcegenHist, String>, QMdSgSourcegenHistRepository {

    List<MdSgSourcegenHist> findByProjectIdOrderByGenDateDesc(String projectId);

    @Modifying
    @Query("DELETE FROM MdSgSourcegenHist h WHERE h.projectId = :projectId")
    int deleteByProjectId(@Param("projectId") String projectId);
}

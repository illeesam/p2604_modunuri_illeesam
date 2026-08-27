package com.shopjoy.ecadminapi.md.sg.repository;

import com.shopjoy.ecadminapi.md.sg.data.entity.MdSgSourcegenHist;
import com.shopjoy.ecadminapi.md.sg.repository.qrydsl.QMdSgSourcegenHistRepository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/* findByProjectIdOrderByGenDateDesc → 이미 있던 QMdSgSourcegenHistRepository.selectList(Request.projectId) 로 전환 (2026-08-27) */
public interface MdSgSourcegenHistRepository extends JpaRepository<MdSgSourcegenHist, String>, QMdSgSourcegenHistRepository {

    @Modifying
    @Query("DELETE FROM MdSgSourcegenHist h WHERE h.projectId = :projectId")
    int deleteByProjectId(@Param("projectId") String projectId);
}

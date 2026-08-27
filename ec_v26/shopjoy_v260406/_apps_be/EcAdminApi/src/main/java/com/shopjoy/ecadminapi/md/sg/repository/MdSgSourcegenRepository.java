package com.shopjoy.ecadminapi.md.sg.repository;

import com.shopjoy.ecadminapi.md.sg.data.entity.MdSgSourcegen;
import com.shopjoy.ecadminapi.md.sg.repository.qrydsl.QMdSgSourcegenRepository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/* findByProjectIdOrderByTabNoAsc → QMdSgSourcegenRepository.selectListByProjectId 로 전환 (2026-08-27) */
public interface MdSgSourcegenRepository extends JpaRepository<MdSgSourcegen, String>, QMdSgSourcegenRepository {

    long countByProjectId(String projectId);

    @Modifying
    @Query("DELETE FROM MdSgSourcegen d WHERE d.projectId = :projectId")
    int deleteByProjectId(@Param("projectId") String projectId);
}

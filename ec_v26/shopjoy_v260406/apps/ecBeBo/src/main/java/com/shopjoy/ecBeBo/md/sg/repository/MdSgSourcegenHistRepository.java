package com.shopjoy.ecadminapi.md.sg.repository;

import com.shopjoy.ecadminapi.md.sg.data.entity.MdSgSourcegenHist;
import com.shopjoy.ecadminapi.md.sg.repository.qrydsl.QMdSgSourcegenHistRepository;
import org.springframework.data.jpa.repository.JpaRepository;

/* findByProjectIdOrderByGenDateDesc → 이미 있던 QMdSgSourcegenHistRepository.selectList(Request.projectId) 로 전환 (2026-08-27) */
public interface MdSgSourcegenHistRepository extends JpaRepository<MdSgSourcegenHist, String>, QMdSgSourcegenHistRepository {

    long deleteByProjectId(String projectId);
}

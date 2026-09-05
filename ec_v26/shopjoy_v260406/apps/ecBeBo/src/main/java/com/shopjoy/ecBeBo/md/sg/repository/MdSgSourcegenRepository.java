package com.shopjoy.ecBeBo.md.sg.repository;

import com.shopjoy.ecBeBo.md.sg.data.entity.MdSgSourcegen;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/* QueryDSL 없이 파생 쿼리로 충분 (단순 단일테이블 조회, 2026-08-27) */
public interface MdSgSourcegenRepository extends JpaRepository<MdSgSourcegen, String> {

    List<MdSgSourcegen> findByProjectIdOrderByTabNoAsc(String projectId);

    long countByProjectId(String projectId);

    long deleteByProjectId(String projectId);
}

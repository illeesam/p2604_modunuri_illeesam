package com.shopjoy.ecadminapi.md.sg.repository;

import com.shopjoy.ecadminapi.md.sg.data.entity.MdSgSourcegen;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

/** MdSgSourcegen — 순수 자식 컬렉션(프로젝트의 DDL 탭)이라 QueryDSL 없이 파생 쿼리로 충분 */
public interface MdSgSourcegenRepository extends JpaRepository<MdSgSourcegen, String> {

    List<MdSgSourcegen> findByProjectIdOrderByTabNoAsc(String projectId);

    long countByProjectId(String projectId);

    @Modifying
    @Query("DELETE FROM MdSgSourcegen d WHERE d.projectId = :projectId")
    int deleteByProjectId(@Param("projectId") String projectId);
}

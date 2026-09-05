package com.shopjoy.ecBeCdn.file.repository;

import com.shopjoy.ecBeCdn.file.entity.CfFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

/**
 * JpaSpecificationExecutor 로 검색을 처리한다(CfFileService.getPage() 의 Specification 참조) —
 * 처음엔 JPQL 하나로 "(:keyword IS NULL OR ...) AND (:mediaTypeCd IS NULL OR ...) AND ..." 패턴을
 * 썼다가 실제로 Postgres 에서 "operator does not exist: character varying ~~ bytea" 를 만났다
 * (2026-09-06) — 같은 바인드 파라미터가 IS NULL 비교와 LIKE 비교에 동시에 쓰이면 PostgreSQL JDBC
 * 가 그 파라미터의 타입을 못 정해 bytea 로 잘못 추론하는 경우가 있다. Specification(Criteria API)
 * 은 조건이 없으면 그 프레디케이트 자체를 아예 안 만들기 때문에 이 문제가 원천적으로 없다.
 */
public interface CfFileRepository extends JpaRepository<CfFile, String>, JpaSpecificationExecutor<CfFile> {

    /** 좌측 폴더트리(CfFileFileList.js) 구성용 — 날짜별(yyyy-MM-dd) 건수. Object[]{day(String), count(Long)}. */
    @Query(value = "SELECT to_char(reg_date, 'YYYY-MM-DD') AS day, COUNT(*) AS cnt " +
                    "FROM cf_file GROUP BY 1 ORDER BY 1 DESC", nativeQuery = true)
    List<Object[]> countByDay();
}

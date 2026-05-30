package com.shopjoy.ecadminapi.base.sy.repository;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyBrand;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyBrandRepository;

import java.util.List;

public interface SyBrandRepository extends JpaRepository<SyBrand, String>, QSyBrandRepository {
    /* 표시경로 노드별 SyBrand 수 집계 (검색조건 + 자손 누적, PostgreSQL 재귀 CTE)
     *   - 일반 path_id : 해당 노드 + 자손 path 의 row 수 (검색조건 적용)
     *   - '__total__'  : 전체 row 수 (검색조건 적용)
     *   - '__orphan__' : path_id IS NULL 인 row 수 (검색조건 적용)
     *
     *   파라미터 — null 이면 해당 조건 무시 (page 그리드와 동일 조건 유지):
     *     - vendorId    : vendor_id 일치
     *     - searchType  : searchValue 검색 대상 컬럼 csv (없으면 전체 컬럼). 호출자가 `,fieldA,fieldB,` 형태로 좌우 콤마 포함 전달
     *     - searchValue : brand_code/brand_nm/brand_en_nm 부분일치 OR (searchType 으로 좁힐 수 있음)
     *     - dateStart/End : reg_date 범위 (BETWEEN 등가)
     */
    @Query(value = """
            WITH RECURSIVE descendants AS (
                SELECT path_id AS root_id, path_id AS leaf_id FROM sy_path
                UNION ALL
                SELECT d.root_id, c.path_id
                  FROM descendants d JOIN sy_path c ON c.parent_path_id = d.leaf_id
            ),
            filtered AS (
                SELECT brand_id, path_id FROM sy_brand t
                 WHERE (CAST(:vendorId    AS varchar) IS NULL OR t.vendor_id = :vendorId)
                   AND (CAST(:searchValue AS varchar) IS NULL OR (
                          ((CAST(:searchType AS varchar) IS NULL OR :searchType = '' OR :searchType LIKE '%,brandCode,%')  AND t.brand_code  ILIKE '%' || :searchValue || '%')
                       OR ((CAST(:searchType AS varchar) IS NULL OR :searchType = '' OR :searchType LIKE '%,brandNm,%')    AND t.brand_nm    ILIKE '%' || :searchValue || '%')
                       OR ((CAST(:searchType AS varchar) IS NULL OR :searchType = '' OR :searchType LIKE '%,brandEnNm,%')  AND t.brand_en_nm ILIKE '%' || :searchValue || '%')
                       ))
                   AND (CAST(:dateStart AS varchar) IS NULL OR t.reg_date >= CAST(:dateStart AS timestamp))
                   AND (CAST(:dateEnd   AS varchar) IS NULL OR t.reg_date <= CAST(:dateEnd   AS timestamp) + INTERVAL '1 day')
            )
            SELECT d.root_id AS path_id, COUNT(t.brand_id) AS cnt
              FROM descendants d
              LEFT JOIN filtered t ON t.path_id = d.leaf_id
             GROUP BY d.root_id
            UNION ALL
            SELECT '__total__' AS path_id, COUNT(*) AS cnt FROM filtered
            UNION ALL
            SELECT '__orphan__' AS path_id, COUNT(*) AS cnt FROM filtered WHERE path_id IS NULL
            """, nativeQuery = true)
    List<Object[]> findPathSyBrandTreeNodeCounts(
            @Param("vendorId")    String vendorId,
            @Param("searchType")  String searchType,
            @Param("searchValue") String searchValue,
            @Param("dateStart")   String dateStart,
            @Param("dateEnd")     String dateEnd);
}

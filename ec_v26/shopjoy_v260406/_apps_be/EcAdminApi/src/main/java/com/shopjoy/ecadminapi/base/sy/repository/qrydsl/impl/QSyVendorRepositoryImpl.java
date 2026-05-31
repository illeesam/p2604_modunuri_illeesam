package com.shopjoy.ecadminapi.base.sy.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecadminapi.base.sy.repository.SyPathRepository;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyVendorDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyVendor;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyVendor;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyVendorRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
/** SyVendor QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyVendorRepositoryImpl implements QSyVendorRepository {

    private final JPAQueryFactory queryFactory;
    private final EntityManager em;
    private final SyPathRepository syPathRepository;
    private static final String QRY_SRC = "base.sy.repository.qrydsl.impl.QSyVendorRepositoryImpl";
    private static final QSyVendor v = QSyVendor.syVendor;
    private static final QSySite ste = QSySite.sySite;
    private static final QSyCode cdVc = new QSyCode("cd_vc");
    private static final QSyCode cdVs = new QSyCode("cd_vs");

    /* 업체(판매자) baseSelColumnQuery */
    private JPAQuery<SyVendorDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(SyVendorDto.Item.class,
                        v.vendorId, v.siteId, v.vendorNo, v.corpNo,
                        v.vendorNm, v.vendorNmEn, v.ceoNm, v.vendorType, v.vendorItem,
                        v.vendorClassCd, v.vendorZipCode, v.vendorAddr, v.vendorAddrDetail,
                        v.vendorPhone, v.vendorFax, v.vendorEmail, v.vendorHomepage,
                        v.vendorBankNm, v.vendorBankAccount, v.vendorBankHolder, v.vendorRegUrl,
                        v.openDate, v.contractDate, v.vendorStatusCd, v.pathId, v.vendorRemark,
                        v.regBy, v.regDate, v.updBy, v.updDate,
                        ste.siteNm.as("siteNm")
                ))
                .from(v)
                .leftJoin(ste).on(ste.siteId.eq(v.siteId))
                .leftJoin(cdVc).on(cdVc.codeGrp.eq("VENDOR_CLASS").and(cdVc.codeValue.eq(v.vendorClassCd)))
                .leftJoin(cdVs).on(cdVs.codeGrp.eq("VENDOR_STATUS").and(cdVs.codeValue.eq(v.vendorStatusCd)));
    }

    /* 업체(판매자) 키조회 */
    @Override
    public Optional<SyVendorDto.Item> selectById(String vendorId) {
        SyVendorDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(v.vendorId.eq(vendorId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 업체(판매자) 목록조회 */
    @Override
    public List<SyVendorDto.Item> selectList(SyVendorDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<SyVendorDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(
                baseAndSiteId(search),
                baseAndPathId(search),
                baseAndVendorId(search),
                baseAndStatus(search),
                baseAndVendorClassCd(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        Integer pageNo = search == null ? null : search.getPageNo();
        Integer pageSize = search == null ? null : search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            query.offset(offset).limit(pageSize);
        }
        return query.fetch();
    }

    /* 업체(판매자) 페이지조회 */
    @Override
    public SyVendorDto.PageResponse selectPageList(SyVendorDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<SyVendorDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageList() :: list").where(
                baseAndSiteId(search),
                baseAndPathId(search),
                baseAndVendorId(search),
                baseAndStatus(search),
                baseAndVendorClassCd(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<SyVendorDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(v.count()).from(v).where(
                baseAndSiteId(search),
                baseAndPathId(search),
                baseAndVendorId(search),
                baseAndStatus(search),
                baseAndVendorClassCd(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        ).fetchOne();

        SyVendorDto.PageResponse res = new SyVendorDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* searchType 사용 예  searchType = "fieldA,fieldB" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(baseAndSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(SyVendorDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? v.siteId.eq(search.getSiteId()) : null;
    }

    /* 표시경로 트리 — 선택 노드 + 모든 자손 경로 포함 */
    private BooleanExpression baseAndPathId(SyVendorDto.Request search) {
        return search != null && StringUtils.hasText(search.getPathId())
                ? v.pathId.in(syPathRepository.findTreePathIds(search.getPathId(), "sy_vendor"))
                : null;
    }

    /* vendorId 정확 일치 */
    private BooleanExpression baseAndVendorId(SyVendorDto.Request search) {
        return search != null && StringUtils.hasText(search.getVendorId())
                ? v.vendorId.eq(search.getVendorId()) : null;
    }

    /* vendorStatusCd 정확 일치 */
    private BooleanExpression baseAndStatus(SyVendorDto.Request search) {
        return search != null && StringUtils.hasText(search.getStatus())
                ? v.vendorStatusCd.eq(search.getStatus()) : null;
    }

    /* vendorClassCd 정확 일치 */
    private BooleanExpression baseAndVendorClassCd(SyVendorDto.Request search) {
        return search != null && StringUtils.hasText(search.getVendorClassCd())
                ? v.vendorClassCd.eq(search.getVendorClassCd()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression baseAndDateRange(SyVendorDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return v.regDate.goe(start).and(v.regDate.lt(endExcl));
            case "upd_date": return v.updDate.goe(start).and(v.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(SyVendorDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",ceoNm,", v.ceoNm, pattern);
        or = orLike(or, all, types, ",corpNo,", v.corpNo, pattern);
        or = orLike(or, all, types, ",pathId,", v.pathId, pattern);
        or = orLike(or, all, types, ",siteId,", v.siteId, pattern);
        or = orLike(or, all, types, ",vendorAddr,", v.vendorAddr, pattern);
        or = orLike(or, all, types, ",vendorAddrDetail,", v.vendorAddrDetail, pattern);
        or = orLike(or, all, types, ",vendorBankAccount,", v.vendorBankAccount, pattern);
        or = orLike(or, all, types, ",vendorBankHolder,", v.vendorBankHolder, pattern);
        or = orLike(or, all, types, ",vendorBankNm,", v.vendorBankNm, pattern);
        or = orLike(or, all, types, ",vendorClassCd,", v.vendorClassCd, pattern);
        or = orLike(or, all, types, ",vendorEmail,", v.vendorEmail, pattern);
        or = orLike(or, all, types, ",vendorFax,", v.vendorFax, pattern);
        or = orLike(or, all, types, ",vendorHomepage,", v.vendorHomepage, pattern);
        or = orLike(or, all, types, ",vendorId,", v.vendorId, pattern);
        or = orLike(or, all, types, ",vendorItem,", v.vendorItem, pattern);
        or = orLike(or, all, types, ",vendorNm,", v.vendorNm, pattern);
        or = orLike(or, all, types, ",vendorNmEn,", v.vendorNmEn, pattern);
        or = orLike(or, all, types, ",vendorNo,", v.vendorNo, pattern);
        or = orLike(or, all, types, ",vendorPhone,", v.vendorPhone, pattern);
        or = orLike(or, all, types, ",vendorRegUrl,", v.vendorRegUrl, pattern);
        or = orLike(or, all, types, ",vendorRemark,", v.vendorRemark, pattern);
        or = orLike(or, all, types, ",vendorStatusCd,", v.vendorStatusCd, pattern);
        or = orLike(or, all, types, ",vendorType,", v.vendorType, pattern);
        or = orLike(or, all, types, ",vendorZipCode,", v.vendorZipCode, pattern);
        return or;
    }

    /* 단일 필드 LIKE 조건을 누적 OR (해당 type 이 포함됐을 때만) */
    private BooleanExpression orLike(BooleanExpression acc, boolean all, String types,
                                     String token, StringPath path, String pattern) {
        if (!(all || types.contains(token))) return acc;
        BooleanExpression expr = path.likeIgnoreCase(pattern);
        return acc == null ? expr : acc.or(expr);
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(SyVendorDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, v.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, v.vendorId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("vendorId".equals(field)) {
                    orders.add(new OrderSpecifier(order, v.vendorId));
                } else if ("vendorNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, v.vendorNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, v.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, v.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, v.vendorId));
        }
        return orders;
    }

    /* 업체(판매자) 수정 */
    @Override
    public int updateSelective(SyVendor entity) {
        if (entity.getVendorId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(v);
        boolean hasAny = false;

        if (entity.getSiteId()            != null) { update.set(v.siteId,            entity.getSiteId());            hasAny = true; }
        if (entity.getVendorNo()          != null) { update.set(v.vendorNo,          entity.getVendorNo());          hasAny = true; }
        if (entity.getCorpNo()            != null) { update.set(v.corpNo,            entity.getCorpNo());            hasAny = true; }
        if (entity.getVendorNm()          != null) { update.set(v.vendorNm,          entity.getVendorNm());          hasAny = true; }
        if (entity.getVendorNmEn()        != null) { update.set(v.vendorNmEn,        entity.getVendorNmEn());        hasAny = true; }
        if (entity.getCeoNm()             != null) { update.set(v.ceoNm,             entity.getCeoNm());             hasAny = true; }
        if (entity.getVendorType()        != null) { update.set(v.vendorType,        entity.getVendorType());        hasAny = true; }
        if (entity.getVendorItem()        != null) { update.set(v.vendorItem,        entity.getVendorItem());        hasAny = true; }
        if (entity.getVendorClassCd()     != null) { update.set(v.vendorClassCd,     entity.getVendorClassCd());     hasAny = true; }
        if (entity.getVendorZipCode()     != null) { update.set(v.vendorZipCode,     entity.getVendorZipCode());     hasAny = true; }
        if (entity.getVendorAddr()        != null) { update.set(v.vendorAddr,        entity.getVendorAddr());        hasAny = true; }
        if (entity.getVendorAddrDetail()  != null) { update.set(v.vendorAddrDetail,  entity.getVendorAddrDetail());  hasAny = true; }
        if (entity.getVendorPhone()       != null) { update.set(v.vendorPhone,       entity.getVendorPhone());       hasAny = true; }
        if (entity.getVendorFax()         != null) { update.set(v.vendorFax,         entity.getVendorFax());         hasAny = true; }
        if (entity.getVendorEmail()       != null) { update.set(v.vendorEmail,       entity.getVendorEmail());       hasAny = true; }
        if (entity.getVendorHomepage()    != null) { update.set(v.vendorHomepage,    entity.getVendorHomepage());    hasAny = true; }
        if (entity.getVendorBankNm()      != null) { update.set(v.vendorBankNm,      entity.getVendorBankNm());      hasAny = true; }
        if (entity.getVendorBankAccount() != null) { update.set(v.vendorBankAccount, entity.getVendorBankAccount()); hasAny = true; }
        if (entity.getVendorBankHolder()  != null) { update.set(v.vendorBankHolder,  entity.getVendorBankHolder());  hasAny = true; }
        if (entity.getVendorRegUrl()      != null) { update.set(v.vendorRegUrl,      entity.getVendorRegUrl());      hasAny = true; }
        if (entity.getOpenDate()          != null) { update.set(v.openDate,          entity.getOpenDate());          hasAny = true; }
        if (entity.getContractDate()      != null) { update.set(v.contractDate,      entity.getContractDate());      hasAny = true; }
        if (entity.getVendorStatusCd()    != null) { update.set(v.vendorStatusCd,    entity.getVendorStatusCd());    hasAny = true; }
        if (entity.getPathId()            != null) { update.set(v.pathId,            entity.getPathId());            hasAny = true; }
        if (entity.getVendorRemark()      != null) { update.set(v.vendorRemark,      entity.getVendorRemark());      hasAny = true; }
        if (entity.getUpdBy()             != null) { update.set(v.updBy,             entity.getUpdBy());             hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(v.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(v.vendorId.eq(entity.getVendorId())).execute();
        return (int) affected;
    }

    /* 표시경로 노드별 sy_vendor 수 집계 (자손 누적 + 검색조건 필터, native CTE 동적 SQL)
     *   반환: [{pathId, cnt}, ...] — '__total__' / '__orphan__' 특수 path 행 포함. */
    @Override
    public List<Map<String, Object>> selectPathTreeVendorCnts(SyVendorDto.Request search) {
        StringBuilder sql = new StringBuilder();
        Map<String, Object> params = new LinkedHashMap<>();

        sql.append("/* " + QRY_SRC + " :: selectPathTreeVendorCnts() */\n");
        sql.append("""
                WITH RECURSIVE descendants /* 각 path 의 자손 path_id (자신 포함, biz_cd 한정) */ AS (
                    SELECT path_id AS root_id, path_id AS leaf_id
                    FROM sy_path
                    WHERE biz_cd = :bizCd
                    UNION ALL
                    SELECT d.root_id, c.path_id
                    FROM descendants d
                    JOIN sy_path c ON c.parent_path_id = d.leaf_id
                    WHERE c.biz_cd = :bizCd
                ),
                filtered /* 검색조건이 적용된 행 */ AS (
                    SELECT vendor_id, path_id
                    FROM sy_vendor t
                    WHERE 1=1
                """);
        params.put("bizCd", "sy_vendor");

        /* 검색조건 — pathtreeAnd*() 헬퍼로 SQL 조각 + 파라미터 함께 추가 */
        pathtreeAndStatus(search, sql, params);
        pathtreeAndSearchValue(search, sql, params);
        pathtreeAndDateRange(search, sql, params);

        sql.append("""
                )
                  /* (1) 일반 path_id 행 : 노드 + 자손 누적 카운트 */
                  SELECT d.root_id AS path_id, COUNT(t.vendor_id) AS cnt
                  FROM descendants d
                    LEFT JOIN filtered t ON t.path_id = d.leaf_id
                  GROUP BY d.root_id
                UNION ALL
                  /* (2) '__total__' : 트리 루트 "전체" 노드용 — 검색조건에 부합하는 전체 카운트 */
                  SELECT '__total__' AS path_id, COUNT(*) AS cnt
                  FROM filtered
                UNION ALL
                  /* (3) '__orphan__' : 경로 미지정(path_id IS NULL) 카운트 — 트리 외 표시 */
                  SELECT '__orphan__' AS path_id, COUNT(*) AS cnt
                  FROM filtered
                  WHERE path_id IS NULL
                """);

        Query q = em.createNativeQuery(sql.toString());
        params.forEach(q::setParameter);

        @SuppressWarnings("unchecked")
        List<Object[]> rows = (List<Object[]>) q.getResultList();

        List<Map<String, Object>> result = new ArrayList<>(rows.size());
        for (Object[] row : rows) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("pathId", row[0] == null ? null : String.valueOf(row[0]));
            m.put("cnt",    row[1] == null ? 0L   : ((Number) row[1]).longValue());
            result.add(m);
        }
        return result;
    }

    /* ============================================================
     * selectPathTreeVendorCnts 전용 SQL 조건 헬퍼
     * ============================================================ */

    private void pathtreeAndStatus(SyVendorDto.Request s, StringBuilder sql, Map<String, Object> p) {
        if (s == null || !StringUtils.hasText(s.getStatus())) return;
        sql.append("      AND t.vendor_status_cd = :statusCd\n");
        p.put("statusCd", s.getStatus());
    }

    private void pathtreeAndSearchValue(SyVendorDto.Request s, StringBuilder sql, Map<String, Object> p) {
        if (s == null || !StringUtils.hasText(s.getSearchValue())) return;
        String raw = s.getSearchType();
        boolean noType = !StringUtils.hasText(raw);
        String st = noType ? "" : "," + raw.trim() + ",";
        sql.append("      AND (\n");
        sql.append("            1=0\n");
        if (noType || st.contains(",vendorNm,"))    sql.append("         OR t.vendor_nm    ILIKE '%' || :searchValue || '%'\n");
        if (noType || st.contains(",vendorNmEn,"))  sql.append("         OR t.vendor_nm_en ILIKE '%' || :searchValue || '%'\n");
        if (noType || st.contains(",ceoNm,"))       sql.append("         OR t.ceo_nm       ILIKE '%' || :searchValue || '%'\n");
        if (noType || st.contains(",vendorEmail,")) sql.append("         OR t.vendor_email ILIKE '%' || :searchValue || '%'\n");
        if (noType || st.contains(",vendorPhone,")) sql.append("         OR t.vendor_phone ILIKE '%' || :searchValue || '%'\n");
        sql.append("      )\n");
        p.put("searchValue", s.getSearchValue());
    }

    private void pathtreeAndDateRange(SyVendorDto.Request s, StringBuilder sql, Map<String, Object> p) {
        if (s == null) return;
        if (StringUtils.hasText(s.getDateStart())) {
            sql.append("      AND t.reg_date >= CAST(:dateStart AS timestamp)\n");
            p.put("dateStart", s.getDateStart());
        }
        if (StringUtils.hasText(s.getDateEnd())) {
            sql.append("      AND t.reg_date <= CAST(:dateEnd   AS timestamp) + INTERVAL '1 day'\n");
            p.put("dateEnd", s.getDateEnd());
        }
    }
}

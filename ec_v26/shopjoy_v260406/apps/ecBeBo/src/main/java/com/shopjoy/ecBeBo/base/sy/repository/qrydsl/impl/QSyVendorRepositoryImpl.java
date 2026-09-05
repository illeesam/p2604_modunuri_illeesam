package com.shopjoy.ecadminapi.base.sy.repository.qrydsl.impl;

import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.data.BasePage;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.DateTimePath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecadminapi.base.sy.repository.SyPathRepository;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyVendorDto;

import com.shopjoy.ecadminapi.base.sy.data.entity.QVwSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyVendor;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyVendor;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyVendorRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyUser;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
/** SyVendor(판매/배송업체 (사업체/법인)) QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyVendorRepositoryImpl implements QSyVendorRepository {

    private final JPAQueryFactory queryFactory;
    private final EntityManager em;
    private final SyPathRepository syPathRepository;
    private static final String QRY_SRC = "base.sy.repository.qrydsl.impl.QSyVendorRepositoryImpl";
    private static final QSyUser regUserEx = new QSyUser("reg_user_ex");
    private static final QSySite regSiteEx = new QSySite("reg_site_ex");
    private static final QSyVendor syVendor = QSyVendor.syVendor;
    private static final QVwSyCode codeVendorClassCd = new QVwSyCode("cd_vc");
    private static final QVwSyCode codeVendorStatusCd = new QVwSyCode("cd_vs");    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * VENDOR_CLASS   {INDIVIDUAL: '개인사업자', CORPORATION: '법인사업자', TAX_EXEMPT: '면세사업자', SIMPLIFIED: '간이과세자'}
     * VENDOR_STATUS  {ACTIVE: '활성', REVIEWING: '심사중', BLOCKED: '정지'}
     */
    /* 업체(판매자) baseSelColumnQuery */
    private JPAQuery<SyVendorDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(SyVendorDto.Item.class,
                        syVendor.vendorId,                    // 판매/배송업체ID (PK, YYMMDDhhmmss+rand4)
                        syVendor.vendorNo,                    // 판매/배송업체등록번호
                        syVendor.corpNo,                      // 법인등록번호 (선택)
                        syVendor.vendorNm,                    // 상호 / 회사명
                        syVendor.vendorNmEn,                  // 영문 상호
                        syVendor.ceoNm,                       // 대표자명
                        syVendor.vendorTypeCd,                  // 업태
                        syVendor.vendorItem,                  // 종목
                        syVendor.vendorClassCd,               // 판매/배송업체구분 — VENDOR_CLASS {INDIVIDUAL: '개인사업자', CORPORATION: '법인사업자', TAX_EXEMPT: '면세사업자', SIMPLIFIED: '간이과세자'}
                        codeVendorClassCd.codeLabel.as("vendorClassCdNm"), // 코드 라벨
                        syVendor.vendorZipCode,               // 우편번호
                        syVendor.vendorAddr,                  // 주소
                        syVendor.vendorAddrDetail,            // 상세주소
                        syVendor.vendorPhone,                 // 대표 전화
                        syVendor.vendorFax,                   // 팩스
                        syVendor.vendorEmail,                 // 대표 이메일
                        syVendor.vendorHomepage,               // 홈페이지
                        syVendor.vendorBankNm,                // 은행명
                        syVendor.vendorBankAccount,           // 계좌번호
                        syVendor.vendorBankHolder,             // 예금주
                        syVendor.vendorRegUrl,                // 판매/배송업체등록증 첨부 URL
                        syVendor.openDate,                    // 개업일자
                        syVendor.contractDate,                // 계약일자
                        syVendor.vendorStatusCd,               // 상태 — VENDOR_STATUS {ACTIVE: '활성', REVIEWING: '심사중', BLOCKED: '정지'}
                        codeVendorStatusCd.codeLabel.as("vendorStatusCdNm"), // 코드 라벨
                        syVendor.pathId,                      // 점(.) 구분 표시경로
                        syVendor.vendorRemark,                // 비고 (HTML 에디터)
                        syVendor.regBy,                       // 등록자
                        syVendor.regDate,                     // 등록일시
                        syVendor.updBy,                       // 수정자
                        syVendor.updDate,                     // 수정일시
                        syVendor.regSiteId,  // 등록사이트ID
                        regSiteEx.siteNm.as("regSiteNm"),  // 등록사이트명 (조인)
                        regUserEx.userNm.as("regUserNm")   // 등록자명 (조인)
                ))
                .from(syVendor)
                .leftJoin(codeVendorClassCd).on(codeVendorClassCd.codeGrp.eq("VENDOR_CLASS_CD").and(codeVendorClassCd.codeValue.eq(syVendor.vendorClassCd))) // 업체등급
                .leftJoin(codeVendorStatusCd).on(codeVendorStatusCd.codeGrp.eq("VENDOR_STATUS_CD").and(codeVendorStatusCd.codeValue.eq(syVendor.vendorStatusCd))) // 업체상태
                .leftJoin(regSiteEx).on(regSiteEx.siteId.eq(syVendor.regSiteId)) // 등록사이트
                .leftJoin(regUserEx).on(regUserEx.userId.eq(syVendor.regBy)) // 등록자
                ;
    }

    /* 업체(판매자) 키조회 */
    @Override
    public Optional<SyVendorDto.Item> selectById(String vendorId) {
        SyVendorDto.Item dtl = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(syVendor.vendorId.eq(vendorId))
                .fetchOne();
        return Optional.ofNullable(dtl);
    }

    /* 업체(판매자) 목록조회 */
    @Override
    public List<SyVendorDto.Item> selectList(SyVendorDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(andPathIdIn(search));
        whereList.add(QdslUtil.strEq(syVendor.vendorId, search.getVendorId())); // 업체ID 검색값
        whereList.add(QdslUtil.strEq(syVendor.vendorStatusCd, search.getStatus())); // 상태 검색값 — VENDOR_STATUS_CD {ACTIVE:활성, INACTIVE:비활성}
        whereList.add(QdslUtil.strEq(syVendor.vendorClassCd, search.getVendorClassCd())); // 업체구분 검색값
        whereList.add(QdslUtil.strEq(syVendor.vendorTypeCd, search.getVendorTypeCd())); // 업태 검색값
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(syVendor.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(syVendor.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<SyVendorDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(wheres)
        .orderBy(orders);
        Integer pageNo = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        List<SyVendorDto.Item> list = query.fetch();
        return list;
    }

    /* 업체(판매자) 페이지조회 */
    @Override
    public BasePage<SyVendorDto.Item> selectPageData(SyVendorDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(andPathIdIn(search));
        whereList.add(QdslUtil.strEq(syVendor.vendorId, search.getVendorId())); // 업체ID 검색값
        whereList.add(QdslUtil.strEq(syVendor.vendorStatusCd, search.getStatus())); // 상태 검색값 — VENDOR_STATUS_CD {ACTIVE:활성, INACTIVE:비활성}
        whereList.add(QdslUtil.strEq(syVendor.vendorClassCd, search.getVendorClassCd())); // 업체구분 검색값
        whereList.add(QdslUtil.strEq(syVendor.vendorTypeCd, search.getVendorTypeCd())); // 업태 검색값
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(syVendor.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(syVendor.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

        JPAQuery<SyVendorDto.Item> query = baseSelColumnQuery();

        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<SyVendorDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(syVendor.count())
                .where(wheres)
                .fetchOne();

        BasePage<SyVendorDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }

    /* 표시경로 트리 — 선택 노드 + 모든 자손 경로 포함 */
    private BooleanExpression andPathIdIn(SyVendorDto.Request search) {
        return search != null && StringUtils.hasText(search.getPathId())
                // [QueryDSL] 표시경로 트리 자손ID 수집
                ? syVendor.pathId.in(syPathRepository.selectTreePathIds(search.getPathId(), "sy_vendor"))
                : null;
    }

    /* searchType 예: "ceoNm,corpNo,pathId,vendorAddr,vendorAddrDetail" 등 (콤마 조합, 미지정 시 전체 OR) */
    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("ceoNm", syVendor.ceoNm), // 대표자명
            QdslUtil.FieldDef.like("corpNo", syVendor.corpNo), // 법인등록번호 (선택)
            QdslUtil.FieldDef.like("pathId", syVendor.pathId), // 표시경로ID 검색값
            QdslUtil.FieldDef.like("vendorAddr", syVendor.vendorAddr), // 주소
            QdslUtil.FieldDef.like("vendorAddrDetail", syVendor.vendorAddrDetail), // 상세주소
            QdslUtil.FieldDef.like("vendorBankAccount", syVendor.vendorBankAccount), // 계좌번호
            QdslUtil.FieldDef.like("vendorBankHolder", syVendor.vendorBankHolder), // 예금주
            QdslUtil.FieldDef.like("vendorBankNm", syVendor.vendorBankNm), // 은행명
            QdslUtil.FieldDef.like("vendorClassCd", syVendor.vendorClassCd), // 업체구분 검색값
            QdslUtil.FieldDef.like("vendorEmail", syVendor.vendorEmail), // 대표 이메일
            QdslUtil.FieldDef.like("vendorFax", syVendor.vendorFax), // 팩스
            QdslUtil.FieldDef.like("vendorHomepage", syVendor.vendorHomepage), // 홈페이지
            QdslUtil.FieldDef.like("vendorId", syVendor.vendorId), // 업체ID 검색값
            QdslUtil.FieldDef.like("vendorItem", syVendor.vendorItem), // 종목
            QdslUtil.FieldDef.like("vendorNm", syVendor.vendorNm), // 상호 / 회사명
            QdslUtil.FieldDef.like("vendorNmEn", syVendor.vendorNmEn), // 영문 상호
            QdslUtil.FieldDef.like("vendorNo", syVendor.vendorNo), // 판매/배송업체등록번호
            QdslUtil.FieldDef.like("vendorPhone", syVendor.vendorPhone), // 대표 전화
            QdslUtil.FieldDef.like("vendorRegUrl", syVendor.vendorRegUrl), // 판매/배송업체등록증 첨부 URL
            QdslUtil.FieldDef.like("vendorRemark", syVendor.vendorRemark), // 비고 (HTML 에디터)
            QdslUtil.FieldDef.like("vendorStatusCd", syVendor.vendorStatusCd), // 상태 — VENDOR_STATUS_CD {ACTIVE:활성, INACTIVE:비활성}
            QdslUtil.FieldDef.like("vendorTypeCd", syVendor.vendorTypeCd), // 업태 검색값
            QdslUtil.FieldDef.like("vendorZipCode", syVendor.vendorZipCode) // 우편번호
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("vendorId", syVendor.vendorId,
                   "vendorNm", syVendor.vendorNm,
                   "regDate", syVendor.regDate),
        new OrderSpecifier<>(Order.DESC, syVendor.regDate),
        new OrderSpecifier<>(Order.ASC, syVendor.vendorId));
    }

    /* 업체(판매자) 수정 */
    @Override
    public int updateSelective(SyVendor entity) {
        if (entity.getVendorId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(syVendor);
        boolean hasAny = false;

        if (entity.getVendorNo()          != null) { update.set(syVendor.vendorNo,          entity.getVendorNo());          hasAny = true; }
        if (entity.getCorpNo()            != null) { update.set(syVendor.corpNo,            entity.getCorpNo());            hasAny = true; }
        if (entity.getVendorNm()          != null) { update.set(syVendor.vendorNm,          entity.getVendorNm());          hasAny = true; }
        if (entity.getVendorNmEn()        != null) { update.set(syVendor.vendorNmEn,        entity.getVendorNmEn());        hasAny = true; }
        if (entity.getCeoNm()             != null) { update.set(syVendor.ceoNm,             entity.getCeoNm());             hasAny = true; }
        if (entity.getVendorTypeCd()        != null) { update.set(syVendor.vendorTypeCd,        entity.getVendorTypeCd());        hasAny = true; }
        if (entity.getVendorItem()        != null) { update.set(syVendor.vendorItem,        entity.getVendorItem());        hasAny = true; }
        if (entity.getVendorClassCd()     != null) { update.set(syVendor.vendorClassCd,     entity.getVendorClassCd());     hasAny = true; }
        if (entity.getVendorZipCode()     != null) { update.set(syVendor.vendorZipCode,     entity.getVendorZipCode());     hasAny = true; }
        if (entity.getVendorAddr()        != null) { update.set(syVendor.vendorAddr,        entity.getVendorAddr());        hasAny = true; }
        if (entity.getVendorAddrDetail()  != null) { update.set(syVendor.vendorAddrDetail,  entity.getVendorAddrDetail());  hasAny = true; }
        if (entity.getVendorPhone()       != null) { update.set(syVendor.vendorPhone,       entity.getVendorPhone());       hasAny = true; }
        if (entity.getVendorFax()         != null) { update.set(syVendor.vendorFax,         entity.getVendorFax());         hasAny = true; }
        if (entity.getVendorEmail()       != null) { update.set(syVendor.vendorEmail,       entity.getVendorEmail());       hasAny = true; }
        if (entity.getVendorHomepage()    != null) { update.set(syVendor.vendorHomepage,    entity.getVendorHomepage());    hasAny = true; }
        if (entity.getVendorBankNm()      != null) { update.set(syVendor.vendorBankNm,      entity.getVendorBankNm());      hasAny = true; }
        if (entity.getVendorBankAccount() != null) { update.set(syVendor.vendorBankAccount, entity.getVendorBankAccount()); hasAny = true; }
        if (entity.getVendorBankHolder()  != null) { update.set(syVendor.vendorBankHolder,  entity.getVendorBankHolder());  hasAny = true; }
        if (entity.getVendorRegUrl()      != null) { update.set(syVendor.vendorRegUrl,      entity.getVendorRegUrl());      hasAny = true; }
        if (entity.getOpenDate()          != null) { update.set(syVendor.openDate,          entity.getOpenDate());          hasAny = true; }
        if (entity.getContractDate()      != null) { update.set(syVendor.contractDate,      entity.getContractDate());      hasAny = true; }
        if (entity.getVendorStatusCd()    != null) { update.set(syVendor.vendorStatusCd,    entity.getVendorStatusCd());    hasAny = true; }
        if (entity.getPathId()            != null) { update.set(syVendor.pathId,            entity.getPathId());            hasAny = true; }
        if (entity.getVendorRemark()      != null) { update.set(syVendor.vendorRemark,      entity.getVendorRemark());      hasAny = true; }
        if (entity.getUpdBy()             != null) { update.set(syVendor.updBy,             entity.getUpdBy());             hasAny = true; }
        update.set(syVendor.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(syVendor.vendorId.eq(entity.getVendorId())).execute();
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
        pathtreeAndVendorType(search, sql, params);
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

    private void pathtreeAndVendorType(SyVendorDto.Request s, StringBuilder sql, Map<String, Object> p) {
        if (s == null || !StringUtils.hasText(s.getVendorTypeCd())) return;
        sql.append("      AND t.vendor_type = :vendorTypeCd\n");
        p.put("vendorTypeCd", s.getVendorTypeCd());
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
        if (StringUtils.hasText(s.getDateRangeStart())) {
            sql.append("      AND t.reg_date >= CAST(:dateRangeStart AS timestamp)\n");
            p.put("dateRangeStart", s.getDateRangeStart());
        }
        if (StringUtils.hasText(s.getDateRangeEnd())) {
            sql.append("      AND t.reg_date <= CAST(:dateRangeEnd   AS timestamp) + INTERVAL '23:59:59.999999'\n");
            p.put("dateRangeEnd", s.getDateRangeEnd());
        }
    }
}

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
import com.shopjoy.ecadminapi.base.sy.data.dto.SyAttachGrpDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyAttachGrp;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyAttachGrp;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyAttachGrpRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** SyAttachGrp QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyAttachGrpRepositoryImpl implements QSyAttachGrpRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.sy.repository.qrydsl.impl.QSyAttachGrpRepositoryImpl";
    private static final QSyAttachGrp syAttachGrp = QSyAttachGrp.syAttachGrp;
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("attachGrpCode", syAttachGrp.attachGrpCode),
        Map.entry("attachGrpId", syAttachGrp.attachGrpId),
        Map.entry("attachGrpNm", syAttachGrp.attachGrpNm),
        Map.entry("attachGrpRemark", syAttachGrp.attachGrpRemark),
        Map.entry("fileExtAllow", syAttachGrp.fileExtAllow),
        Map.entry("siteId", syAttachGrp.siteId),
        Map.entry("storagePath", syAttachGrp.storagePath),
        Map.entry("useYn", syAttachGrp.useYn)
    );

    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * USE_YN  {Y: '사용', N: '미사용'} (sy_code 미등록 — DDL 기본값 'Y' 기반 표기)
     */
    private JPAQuery<SyAttachGrpDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(SyAttachGrpDto.Item.class,
                        syAttachGrp.attachGrpId,       // 파일 그룹 ID (ATG + timestamp + random)
                        syAttachGrp.attachGrpCode,     // 그룹 코드 (businessCode + "_" + timestamp)
                        syAttachGrp.attachGrpNm,       // 그룹 이름 (사용자에게 표시되는 이름)
                        syAttachGrp.fileExtAllow,      // 허용 확장자 목록
                        syAttachGrp.maxFileSize,       // 그룹 내 단일 파일 최대 크기
                        syAttachGrp.maxFileCount,      // 그룹 내 최대 파일 개수
                        syAttachGrp.storagePath,       // 저장 경로
                        syAttachGrp.useYn,             // 사용 여부 — USE_YN {Y: '사용', N: '미사용'}
                        syAttachGrp.sortOrd,           // 정렬순서
                        syAttachGrp.attachGrpRemark,   // 비고
                        syAttachGrp.regBy,             // 등록자
                        syAttachGrp.regDate,           // 등록일시
                        syAttachGrp.updBy,             // 수정자
                        syAttachGrp.updDate            // 수정일시
                ))
                .from(syAttachGrp);
    }

    /* 첨부파일 그룹 키조회 */
    @Override
    public Optional<SyAttachGrpDto.Item> selectById(String attachGrpId) {
        SyAttachGrpDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(syAttachGrp.attachGrpId.eq(attachGrpId)).fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 첨부파일 그룹 목록조회 */
    @Override
    public List<SyAttachGrpDto.Item> selectList(SyAttachGrpDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<SyAttachGrpDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    QdslUtil.strEq(syAttachGrp.attachGrpId, search.getAttachGrpId()),
                    andSearchValueLike(search)
                )
                .orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        return query.fetch();
    }

    /* 첨부파일 그룹 페이지조회 */
    @Override
    public SyAttachGrpDto.PageResponse selectPageData(SyAttachGrpDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strEq(syAttachGrp.attachGrpId, search.getAttachGrpId()),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<SyAttachGrpDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<SyAttachGrpDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(syAttachGrp.count())
                .where(wheres)
                .fetchOne();

        SyAttachGrpDto.PageResponse res = new SyAttachGrpDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }
    /* searchType 사용 예  searchType = "fieldA,fieldB" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    private BooleanExpression andSearchValueLike(SyAttachGrpDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
    }


    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(SyAttachGrpDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {

            /* sortOrd ASC + regDate ASC (전역 정책) */
            orders.add(new OrderSpecifier<>(Order.ASC, syAttachGrp.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, syAttachGrp.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, syAttachGrp.attachGrpId));

            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("attachGrpId".equals(field)) {
                    orders.add(new OrderSpecifier(order, syAttachGrp.attachGrpId));
                } else if ("attachGrpNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, syAttachGrp.attachGrpNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, syAttachGrp.regDate));
                }
                else if ("sortOrd".equals(field)) { orders.add(new OrderSpecifier(order, syAttachGrp.sortOrd)); }
            }
        }
        /* unknown sort → sortOrd ASC + regDate ASC fallback */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.ASC, syAttachGrp.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, syAttachGrp.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, syAttachGrp.attachGrpId));
        }
        return orders;
    }

    /* 첨부파일 그룹 수정 */

    @Override
    public int updateSelective(SyAttachGrp entity) {
        if (entity.getAttachGrpId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(syAttachGrp);
        boolean hasAny = false;

        if (entity.getAttachGrpCode()   != null) { update.set(syAttachGrp.attachGrpCode,   entity.getAttachGrpCode());   hasAny = true; }
        if (entity.getAttachGrpNm()     != null) { update.set(syAttachGrp.attachGrpNm,     entity.getAttachGrpNm());     hasAny = true; }
        if (entity.getFileExtAllow()    != null) { update.set(syAttachGrp.fileExtAllow,    entity.getFileExtAllow());    hasAny = true; }
        if (entity.getMaxFileSize()     != null) { update.set(syAttachGrp.maxFileSize,     entity.getMaxFileSize());     hasAny = true; }
        if (entity.getMaxFileCount()    != null) { update.set(syAttachGrp.maxFileCount,    entity.getMaxFileCount());    hasAny = true; }
        if (entity.getStoragePath()     != null) { update.set(syAttachGrp.storagePath,     entity.getStoragePath());     hasAny = true; }
        if (entity.getUseYn()           != null) { update.set(syAttachGrp.useYn,           entity.getUseYn());           hasAny = true; }
        if (entity.getSortOrd()         != null) { update.set(syAttachGrp.sortOrd,         entity.getSortOrd());         hasAny = true; }
        if (entity.getAttachGrpRemark() != null) { update.set(syAttachGrp.attachGrpRemark, entity.getAttachGrpRemark()); hasAny = true; }
        if (entity.getUpdBy()           != null) { update.set(syAttachGrp.updBy,           entity.getUpdBy());           hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(syAttachGrp.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(syAttachGrp.attachGrpId.eq(entity.getAttachGrpId())).execute();
        return (int) affected;
    }
}

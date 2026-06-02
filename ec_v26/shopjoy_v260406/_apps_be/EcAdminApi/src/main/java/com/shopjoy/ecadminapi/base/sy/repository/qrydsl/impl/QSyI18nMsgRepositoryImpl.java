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
import com.shopjoy.ecadminapi.base.sy.data.dto.SyI18nMsgDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyI18nMsg;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyI18nMsg;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyI18nMsgRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
/** SyI18nMsg QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyI18nMsgRepositoryImpl implements QSyI18nMsgRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.sy.repository.qrydsl.impl.QSyI18nMsgRepositoryImpl";
    private static final QSyI18nMsg syI18nMsg = QSyI18nMsg.syI18nMsg;
    private static final DateTimeFormatter DF = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    /* 다국어 메시지 baseSelColumnQuery */
    private JPAQuery<SyI18nMsgDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(SyI18nMsgDto.Item.class,
                        syI18nMsg.i18nMsgId, syI18nMsg.i18nId, syI18nMsg.langCd, syI18nMsg.i18nMsg,
                        syI18nMsg.regBy, syI18nMsg.regDate, syI18nMsg.updBy, syI18nMsg.updDate
                ))
                .from(syI18nMsg);
    }

    /* 다국어 메시지 키조회 */
    @Override
    public Optional<SyI18nMsgDto.Item> selectById(String i18nMsgId) {
        SyI18nMsgDto.Item dto = baseSelColumnQuery().where(syI18nMsg.i18nMsgId.eq(i18nMsgId)).fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 다국어 메시지 목록조회 */
    @Override
    public List<SyI18nMsgDto.Item> selectList(SyI18nMsgDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<SyI18nMsgDto.Item> query = baseSelColumnQuery().where(
                baseAndI18nMsgId(search),
                baseAndI18nId(search),
                baseAndLangCd(search),
                baseAndSearchValue(search)
        );
        if (!orderList.isEmpty()) query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            query.offset(offset).limit(pageSize);
        }
        return query.fetch();
    }

    /* 다국어 메시지 페이지조회 */
    @Override
    public SyI18nMsgDto.PageResponse selectPageData(SyI18nMsgDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                baseAndI18nMsgId(search),
                baseAndI18nId(search),
                baseAndLangCd(search),
                baseAndSearchValue(search)
        };

        JPAQuery<SyI18nMsgDto.Item> query = baseSelColumnQuery().where(wheres);
        if (!orderList.isEmpty()) query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        List<SyI18nMsgDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(syI18nMsg.count()).from(syI18nMsg).where(wheres).fetchOne();

        SyI18nMsgDto.PageResponse res = new SyI18nMsgDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }
    /* 다국어 메시지 buildCondition */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* i18nMsgId 정확 일치 */
    private BooleanExpression baseAndI18nMsgId(SyI18nMsgDto.Request search) {
        return search != null && StringUtils.hasText(search.getI18nMsgId())
                ? syI18nMsg.i18nMsgId.eq(search.getI18nMsgId()) : null;
    }

    /* i18nId 정확 일치 */
    private BooleanExpression baseAndI18nId(SyI18nMsgDto.Request search) {
        return search != null && StringUtils.hasText(search.getI18nId())
                ? syI18nMsg.i18nId.eq(search.getI18nId()) : null;
    }

    /* langCd 정확 일치 */
    private BooleanExpression baseAndLangCd(SyI18nMsgDto.Request search) {
        return search != null && StringUtils.hasText(search.getLangCd())
                ? syI18nMsg.langCd.eq(search.getLangCd()) : null;
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(SyI18nMsgDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",i18nId,", syI18nMsg.i18nId, pattern);
        or = orLike(or, all, types, ",i18nMsg,", syI18nMsg.i18nMsg, pattern);
        or = orLike(or, all, types, ",i18nMsgId,", syI18nMsg.i18nMsgId, pattern);
        or = orLike(or, all, types, ",langCd,", syI18nMsg.langCd, pattern);
        or = orLike(or, all, types, ",siteId,", syI18nMsg.siteId, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(SyI18nMsgDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, syI18nMsg.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, syI18nMsg.i18nMsgId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("i18nMsgId".equals(field)) {
                    orders.add(new OrderSpecifier(order, syI18nMsg.i18nMsgId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, syI18nMsg.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, syI18nMsg.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, syI18nMsg.i18nMsgId));
        }
        return orders;
    }

    /* 다국어 메시지 수정 */


    @Override
    public int updateSelective(SyI18nMsg entity) {
        if (entity.getI18nMsgId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(syI18nMsg);
        boolean hasAny = false;

        if (entity.getI18nId()  != null) { update.set(syI18nMsg.i18nId,  entity.getI18nId());  hasAny = true; }
        if (entity.getLangCd()  != null) { update.set(syI18nMsg.langCd,  entity.getLangCd());  hasAny = true; }
        if (entity.getI18nMsg() != null) { update.set(syI18nMsg.i18nMsg, entity.getI18nMsg()); hasAny = true; }
        if (entity.getUpdBy()   != null) { update.set(syI18nMsg.updBy,   entity.getUpdBy());   hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(syI18nMsg.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(syI18nMsg.i18nMsgId.eq(entity.getI18nMsgId())).execute();
        return (int) affected;
    }
}

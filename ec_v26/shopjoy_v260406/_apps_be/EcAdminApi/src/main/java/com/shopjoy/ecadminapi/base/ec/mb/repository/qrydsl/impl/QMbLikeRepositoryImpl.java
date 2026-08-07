package com.shopjoy.ecadminapi.base.ec.mb.repository.qrydsl.impl;

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
import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbLikeDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbLike;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.QMbLike;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.QMbMember;
import com.shopjoy.ecadminapi.base.ec.mb.repository.qrydsl.QMbLikeRepository;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProd;

import com.shopjoy.ecadminapi.base.sy.data.entity.QVwSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
@RequiredArgsConstructor
public class QMbLikeRepositoryImpl implements QMbLikeRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.mb.repository.qrydsl.impl.QMbLikeRepositoryImpl";
    private static final QMbLike   mbLike    = QMbLike.mbLike;
    private static final QSySite   sySite  = QSySite.sySite;
    private static final QMbMember mbMember  = QMbMember.mbMember;
    private static final QPdProd   pdProd  = QPdProd.pdProd;
    private static final QVwSyCode   cdLt = new QVwSyCode("cd_ltt");
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_RANGE_FIELDS = Map.of("reg_date", mbLike.regDate,
        "upd_date", mbLike.updDate
    );

    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * TARGET_TYPE_CD (코드: LIKE_TARGET_TYPE)  {PRODUCT: '상품', BRAND: '브랜드'}
     */
    private JPAQuery<MbLikeDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(MbLikeDto.Item.class,
                        mbLike.likeId,         // 좋아요ID (PK)
                        mbLike.memberId,       // 회원ID (mb_member.member_id)
                        mbLike.targetTypeCd,   // 대상유형 — LIKE_TARGET_TYPE {PRODUCT: '상품', BRAND: '브랜드'}
                        mbLike.targetId,       // 대상ID (targetTypeCd 별 참조 테이블 PK)
                        mbLike.regBy,          // 등록자
                        mbLike.regDate,        // 등록일
                        mbLike.updBy,          // 수정자
                        mbLike.updDate         // 수정일
                ))
                .from(mbLike)
                .leftJoin(mbMember).on(mbMember.memberId.eq(mbLike.memberId))
                .leftJoin(pdProd).on(pdProd.prodId.eq(mbLike.targetId))
                .leftJoin(cdLt).on(cdLt.codeGrp.eq("LIKE_TARGET_TYPE").and(cdLt.codeValue.eq(mbLike.targetTypeCd)));
    }

    /* 좋아요(찜) 키조회 */
    @Override
    public Optional<MbLikeDto.Item> selectById(String likeId) {
        return Optional.ofNullable(baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(mbLike.likeId.eq(likeId)).fetchOne());
    }

    /* 좋아요(찜) 목록조회 */
    @Override
    public List<MbLikeDto.Item> selectList(MbLikeDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        JPAQuery<MbLikeDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    QdslUtil.strEq(mbLike.likeId, search.getLikeId()),
                    QdslUtil.strEq(mbLike.memberId, search.getMemberId()),
                    QdslUtil.strEq(mbLike.targetId, search.getTargetId()),
                    QdslUtil.strEq(mbLike.targetTypeCd, search.getTargetTypeCd()),
                    QdslUtil.dateBetween(search.getDateRangeType(), search.getDateRangeStart(), search.getDateRangeEnd(), DATE_RANGE_FIELDS),
                    andSearchValue(search.getSearchValue(), search.getSearchType())
                )
                .orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo = search.getPageNo(), pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        return query.fetch();
    }

    /* 좋아요(찜) 페이지조회 */
    @Override
    public BasePage<MbLikeDto.Item> selectPageData(MbLikeDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        BooleanExpression[] wheres = {
                QdslUtil.strEq(mbLike.likeId, search.getLikeId()),
                QdslUtil.strEq(mbLike.memberId, search.getMemberId()),
                QdslUtil.strEq(mbLike.targetId, search.getTargetId()),
                QdslUtil.strEq(mbLike.targetTypeCd, search.getTargetTypeCd()),
                QdslUtil.dateBetween(search.getDateRangeType(), search.getDateRangeStart(), search.getDateRangeEnd(), DATE_RANGE_FIELDS),
                andSearchValue(search.getSearchValue(), search.getSearchType())
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<MbLikeDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<MbLikeDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(mbLike.count())
                .where(wheres)
                .fetchOne();

        BasePage<MbLikeDto.Item> res = new BasePage<>();
        return res.setPageInfo(content, CmUtil.nvlLong(total), pageNo, pageSize, search);
    }

    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("likeId", mbLike.likeId),
            QdslUtil.FieldDef.like("memberId", mbLike.memberId),
            QdslUtil.FieldDef.like("targetId", mbLike.targetId),
            QdslUtil.FieldDef.like("targetTypeCd", mbLike.targetTypeCd)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("likeId", mbLike.likeId,
                   "regDate", mbLike.regDate),
        new OrderSpecifier<>(Order.DESC, mbLike.regDate),
        new OrderSpecifier<>(Order.ASC, mbLike.likeId));
    }

    /* 좋아요(찜) 수정 */

    @Override
    public int updateSelective(MbLike entity) {
        if (entity.getLikeId() == null) return 0;
        JPAUpdateClause update = queryFactory.update(mbLike);
        boolean hasAny = false;
        if (entity.getMemberId()     != null) { update.set(mbLike.memberId,     entity.getMemberId());     hasAny = true; }
        if (entity.getTargetTypeCd() != null) { update.set(mbLike.targetTypeCd, entity.getTargetTypeCd()); hasAny = true; }
        if (entity.getTargetId()     != null) { update.set(mbLike.targetId,     entity.getTargetId());     hasAny = true; }
        if (entity.getUpdBy()        != null) { update.set(mbLike.updBy,        entity.getUpdBy());        hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(mbLike.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));
        if (!hasAny) return 0;
        return (int) update.where(mbLike.likeId.eq(entity.getLikeId())).execute();
    }
}

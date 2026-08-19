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
import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberSnsDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMemberSns;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.QMbMember;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.QMbMemberSns;
import com.shopjoy.ecadminapi.base.ec.mb.repository.qrydsl.QMbMemberSnsRepository;

import com.shopjoy.ecadminapi.base.sy.data.entity.QVwSyCode;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
@RequiredArgsConstructor
public class QMbMemberSnsRepositoryImpl implements QMbMemberSnsRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.mb.repository.qrydsl.impl.QMbMemberSnsRepositoryImpl";
    private static final QMbMemberSns mbMemberSns    = QMbMemberSns.mbMemberSns;
    private static final QMbMember    mbMember  = QMbMember.mbMember;
    private static final QVwSyCode      cdSc = new QVwSyCode("cd_sc");    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * SNS_CHANNEL_CD (코드: SNS_CHANNEL_CD)  {KAKAO: '카카오', NAVER: '네이버', GOOGLE: '구글', APPLE: '애플'}
     */
    private JPAQuery<MbMemberSnsDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(MbMemberSnsDto.Item.class,
                        mbMemberSns.memberSnsId,   // SNS연동ID (PK)
                        mbMemberSns.memberId,      // 회원ID (mb_member.member_id)
                        mbMemberSns.snsChannelCd,  // SNS채널코드 — SNS_CHANNEL {KAKAO: '카카오', NAVER: '네이버', GOOGLE: '구글', APPLE: '애플'}
                        mbMemberSns.snsUserId,     // SNS 플랫폼 사용자ID
                        mbMemberSns.regBy,         // 등록자ID
                        mbMemberSns.regDate        // 등록일시
                ))
                .from(mbMemberSns)
                .leftJoin(mbMember).on(mbMember.memberId.eq(mbMemberSns.memberId)) // 회원
                .leftJoin(cdSc).on(cdSc.codeGrp.eq("SNS_CHANNEL_CD").and(cdSc.codeValue.eq(mbMemberSns.snsChannelCd))) // SNS채널
                ;
    }

    /* SNS 연동 회원 키조회 */
    @Override
    public Optional<MbMemberSnsDto.Item> selectById(String memberSnsId) {
        return Optional.ofNullable(baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(mbMemberSns.memberSnsId.eq(memberSnsId)).fetchOne());
    }

    /* SNS 연동 회원 목록조회 */
    @Override
    public List<MbMemberSnsDto.Item> selectList(MbMemberSnsDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strIn(mbMemberSns.memberId, search.getMemberIds()));
        whereList.add(QdslUtil.strEq(mbMemberSns.memberId, search.getMemberId()));
        whereList.add(QdslUtil.strEq(mbMemberSns.memberSnsId, search.getMemberSnsId()));
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(mbMemberSns.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(mbMemberSns.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<MbMemberSnsDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(wheres)
                .orderBy(orders);
        Integer pageNo = search.getPageNo(), pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        List<MbMemberSnsDto.Item> list = query.fetch();
        return list;
    }

    /* SNS 연동 회원 페이지조회 */
    @Override
    public BasePage<MbMemberSnsDto.Item> selectPageData(MbMemberSnsDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strIn(mbMemberSns.memberId, search.getMemberIds()));
        whereList.add(QdslUtil.strEq(mbMemberSns.memberId, search.getMemberId()));
        whereList.add(QdslUtil.strEq(mbMemberSns.memberSnsId, search.getMemberSnsId()));
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(mbMemberSns.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(mbMemberSns.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

        JPAQuery<MbMemberSnsDto.Item> query = baseSelColumnQuery();

        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<MbMemberSnsDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(mbMemberSns.count())
                .where(wheres)
                .fetchOne();

        BasePage<MbMemberSnsDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }

    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("memberId", mbMemberSns.memberId),
            QdslUtil.FieldDef.like("memberSnsId", mbMemberSns.memberSnsId),
            QdslUtil.FieldDef.like("snsChannelCd", mbMemberSns.snsChannelCd),
            QdslUtil.FieldDef.like("snsUserId", mbMemberSns.snsUserId)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("memberSnsId", mbMemberSns.memberSnsId,
                   "regDate", mbMemberSns.regDate),
        new OrderSpecifier<>(Order.DESC, mbMemberSns.regDate),
        new OrderSpecifier<>(Order.ASC, mbMemberSns.memberSnsId));
    }

    /* SNS 연동 회원 수정 */
    @Override
    public int updateSelective(MbMemberSns entity) {
        if (entity.getMemberSnsId() == null) return 0;
        JPAUpdateClause update = queryFactory.update(mbMemberSns);
        boolean hasAny = false;
        if (entity.getMemberId()     != null) { update.set(mbMemberSns.memberId,     entity.getMemberId());     hasAny = true; }
        if (entity.getSnsChannelCd() != null) { update.set(mbMemberSns.snsChannelCd, entity.getSnsChannelCd()); hasAny = true; }
        if (entity.getSnsUserId()    != null) { update.set(mbMemberSns.snsUserId,    entity.getSnsUserId());    hasAny = true; }
        if (!hasAny) return 0;
        return (int) update.where(mbMemberSns.memberSnsId.eq(entity.getMemberSnsId())).execute();
    }
}

package com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.impl;

import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.data.BasePage;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.DateTimePath;
import com.querydsl.jpa.JPAExpressions;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.QMbMember;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmSaveDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmSave;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmSave;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmSaveProd;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmSaveRepository;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProd;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyVendor;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyUser;

import com.shopjoy.ecadminapi.base.sy.data.entity.QVwSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** PmSave QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPmSaveRepositoryImpl implements QPmSaveRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pm.repository.qrydsl.impl.QPmSaveRepositoryImpl";
    private static final QPmSave   pmSave    = QPmSave.pmSave;
    private static final QSySite   sySite  = QSySite.sySite;
    private static final QMbMember mbMember  = QMbMember.mbMember;
    private static final QVwSyCode   cdSt = new QVwSyCode("cd_st");
    // EXISTS 서브쿼리용 별칭 (대상상품/업체/담당MD 필터 — pm_save_prod → pd_prod → sy_vendor/sy_user)
    private static final QPmSaveProd saveProdEx = new QPmSaveProd("save_prod_ex");
    private static final QPdProd     pProdEx    = new QPdProd("p_prod_ex");
    private static final QSyVendor   syVendorEx = new QSyVendor("sy_vendor_ex");
    private static final QSyUser     syUserEx   = new QSyUser("sy_user_ex");
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_RANGE_FIELDS = Map.of("reg_date", pmSave.regDate,
        "upd_date", pmSave.updDate
    );

    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * SAVE_TYPE  {EARN: '적립', USE: '사용', EXPIRE: '소멸', CANCEL: '적립취소', ADMIN: '관리자조정'} (Entity 주석: EARN/USE/EXPIRE/CANCEL/ADMIN)
     * refTypeCd  연관유형 (예: ORDER/EVENT/ADMIN 등, Entity 주석 기준)
     */
    private JPAQuery<PmSaveDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PmSaveDto.Item.class,
                        pmSave.saveId,        // 적립금ID (PK, YYMMDDhhmmss+rand4)
                        pmSave.memberId,      // 회원ID (mb_member.member_id)
                        pmSave.saveTypeCd,    // 적립금유형 — SAVE_TYPE {EARN, USE, EXPIRE, CANCEL, ADMIN}
                        pmSave.saveAmt,       // 변동액 (양수:적립, 음수:차감)
                        pmSave.balanceAmt,    // 처리 후 잔액
                        pmSave.refTypeCd,     // 연관유형 (ORDER/EVENT/ADMIN 등)
                        pmSave.refId,         // 연관ID
                        pmSave.expireDate,    // 소멸예정일
                        pmSave.saveMemo,      // 메모
                        pmSave.regBy, pmSave.regDate
                ))
                .from(pmSave)
                .leftJoin(mbMember).on(mbMember.memberId.eq(pmSave.memberId))
                .leftJoin(cdSt).on(cdSt.codeGrp.eq("SAVE_TYPE_CD").and(cdSt.codeValue.eq(pmSave.saveTypeCd)));
    }

    /* 적립금 키조회 */
    @Override
    public Optional<PmSaveDto.Item> selectById(String saveId) {
        PmSaveDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(pmSave.saveId.eq(saveId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 적립금 목록조회 */
    @Override
    public List<PmSaveDto.Item> selectList(PmSaveDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        JPAQuery<PmSaveDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    QdslUtil.strIn(pmSave.saveId, search.getSaveIds()),
                    QdslUtil.strEq(pmSave.saveId, search.getSaveId()),
                    QdslUtil.strEq(pmSave.saveTypeCd, search.getSaveTypeCd()),
                    QdslUtil.strEq(pmSave.memberId, search.getMemberId()),
                    QdslUtil.dateBetween(search.getDateRangeType(), search.getDateRangeStart(), search.getDateRangeEnd(), DATE_RANGE_FIELDS),
                    andProdVendorMd(search),
                    andSearchValue(search.getSearchValue(), search.getSearchType())
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

    /* 적립금 페이지조회 */
    @Override
    public BasePage<PmSaveDto.Item> selectPageData(PmSaveDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        BooleanExpression[] wheres = {
                QdslUtil.strIn(pmSave.saveId, search.getSaveIds()),
                QdslUtil.strEq(pmSave.saveId, search.getSaveId()),
                QdslUtil.strEq(pmSave.saveTypeCd, search.getSaveTypeCd()),
                /* ⚠ memberId 가 selectList() 에는 있는데 여기(selectPageData)엔 빠져 있었다
                   — 페이지 조회 모드에서만 회원 필터가 무시되던 기존 버그. 같이 정정. */
                QdslUtil.strEq(pmSave.memberId, search.getMemberId()),
                QdslUtil.dateBetween(search.getDateRangeType(), search.getDateRangeStart(), search.getDateRangeEnd(), DATE_RANGE_FIELDS),
                andProdVendorMd(search),
                andSearchValue(search.getSearchValue(), search.getSearchType())
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<PmSaveDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<PmSaveDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(pmSave.count())
                .where(wheres)
                .fetchOne();

        BasePage<PmSaveDto.Item> res = new BasePage<>();
        return res.setPageInfo(content, CmUtil.nvlLong(total), pageNo, pageSize, search);
    }

    /** andProdVendorMd — 대상상품/업체/담당MD 필터. pm_save_prod(save_id↔prod_id) 를 거쳐
     *  pd_prod 의 vendor_id/md_user_id 까지 조인해야 하는 2단 EXISTS. */
    private BooleanExpression andProdVendorMd(PmSaveDto.Request search) {
        boolean needProd   = StringUtils.hasText(search.getProdId()) || StringUtils.hasText(search.getProdNm());
        boolean needVendor = StringUtils.hasText(search.getVendorId()) || StringUtils.hasText(search.getVendorNm());
        boolean needMd     = StringUtils.hasText(search.getMdUserId()) || StringUtils.hasText(search.getMdUserNm());
        if (!needProd && !needVendor && !needMd) return null;

        com.querydsl.jpa.JPQLQuery<Integer> sub = JPAExpressions.selectOne().from(saveProdEx)
            .where(saveProdEx.saveId.eq(pmSave.saveId));

        if (needProd) {
            sub = sub.where(
                QdslUtil.strEq(saveProdEx.prodId, search.getProdId()),
                StringUtils.hasText(search.getProdId()) ? null
                    : JPAExpressions.selectOne().from(pProdEx)
                          .where(pProdEx.prodId.eq(saveProdEx.prodId), QdslUtil.strLike(pProdEx.prodNm, search.getProdNm())).exists());
        }
        if (needVendor) {
            sub = sub.where(JPAExpressions.selectOne().from(pProdEx).join(syVendorEx).on(syVendorEx.vendorId.eq(pProdEx.vendorId))
                .where(pProdEx.prodId.eq(saveProdEx.prodId),
                       QdslUtil.strEq(syVendorEx.vendorId, search.getVendorId()),
                       StringUtils.hasText(search.getVendorId()) ? null : QdslUtil.strLike(syVendorEx.vendorNm, search.getVendorNm()))
                .exists());
        }
        if (needMd) {
            sub = sub.where(JPAExpressions.selectOne().from(pProdEx).join(syUserEx).on(syUserEx.userId.eq(pProdEx.mdUserId))
                .where(pProdEx.prodId.eq(saveProdEx.prodId),
                       QdslUtil.strEq(syUserEx.userId, search.getMdUserId()),
                       StringUtils.hasText(search.getMdUserId()) ? null : QdslUtil.strLike(syUserEx.userNm, search.getMdUserNm()))
                .exists());
        }
        return sub.exists();
    }

    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("memberId", pmSave.memberId),
            QdslUtil.FieldDef.like("refId", pmSave.refId),
            QdslUtil.FieldDef.like("refTypeCd", pmSave.refTypeCd),
            QdslUtil.FieldDef.like("saveId", pmSave.saveId),
            QdslUtil.FieldDef.like("saveMemo", pmSave.saveMemo),
            QdslUtil.FieldDef.like("saveTypeCd", pmSave.saveTypeCd)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("saveId", pmSave.saveId,
                   "regDate", pmSave.regDate),
        new OrderSpecifier<>(Order.DESC, pmSave.regDate),
        new OrderSpecifier<>(Order.ASC, pmSave.saveId));
    }

    /* 적립금 수정 */
    @Override
    public int updateSelective(PmSave entity) {
        if (entity.getSaveId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pmSave);
        boolean hasAny = false;

        if (entity.getMemberId()   != null) { update.set(pmSave.memberId,   entity.getMemberId());   hasAny = true; }
        if (entity.getSaveTypeCd() != null) { update.set(pmSave.saveTypeCd, entity.getSaveTypeCd()); hasAny = true; }
        if (entity.getSaveAmt()    != null) { update.set(pmSave.saveAmt,    entity.getSaveAmt());    hasAny = true; }
        if (entity.getBalanceAmt() != null) { update.set(pmSave.balanceAmt, entity.getBalanceAmt()); hasAny = true; }
        if (entity.getRefTypeCd()  != null) { update.set(pmSave.refTypeCd,  entity.getRefTypeCd());  hasAny = true; }
        if (entity.getRefId()      != null) { update.set(pmSave.refId,      entity.getRefId());      hasAny = true; }
        if (entity.getExpireDate() != null) { update.set(pmSave.expireDate, entity.getExpireDate()); hasAny = true; }
        if (entity.getSaveMemo()   != null) { update.set(pmSave.saveMemo,   entity.getSaveMemo());   hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(pmSave.saveId.eq(entity.getSaveId())).execute();
        return (int) affected;
    }
}

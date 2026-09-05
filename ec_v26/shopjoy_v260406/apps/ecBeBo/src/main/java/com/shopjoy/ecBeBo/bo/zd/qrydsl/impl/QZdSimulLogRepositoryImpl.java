package com.shopjoy.ecBeBo.bo.zd.qrydsl.impl;

import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.shopjoy.ecBeBo.bo.zd.entity.QZdSimulLog;
import com.shopjoy.ecBeBo.bo.zd.entity.ZdSimulLog;
import com.shopjoy.ecBeBo.bo.zd.qrydsl.QZdSimulLogRepository;
import com.shopjoy.ecBeBo.common.util.QdslUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.util.ArrayList;
import java.util.List;

/** ZdSimulLog(시뮬레이터 실행 로그) QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QZdSimulLogRepositoryImpl implements QZdSimulLogRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "bo.zd.qrydsl.impl.QZdSimulLogRepositoryImpl";
    private static final QZdSimulLog zdSimulLog = QZdSimulLog.zdSimulLog;

    /** 시뮬레이터 실행 로그 검색 — siteId 필수 + domain/uiNm/userNm/desc/status 는 선택 필터 */
    @Override
    public Page<ZdSimulLog> selectPage(String siteId, String domain, String uiNm, String userNm, String desc, String status, Pageable pageable) {
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(zdSimulLog.siteId.eq(siteId));                                   // 사이트ID 필수
        whereList.add(QdslUtil.strEq(zdSimulLog.domain, domain));                      // 도메인 필터
        whereList.add(QdslUtil.strLike(zdSimulLog.uiNm, uiNm));                        // 화면명 포함검색
        whereList.add(QdslUtil.strLike(zdSimulLog.userNm, userNm));                    // 실행자명 포함검색
        whereList.add(QdslUtil.strLike(zdSimulLog.descTxt, desc));                     // 실행내용 포함검색
        whereList.add(QdslUtil.strEq(zdSimulLog.simulStatusCd, status));               // 결과상태 필터
        whereList.removeIf(java.util.Objects::isNull);

        List<ZdSimulLog> content = queryFactory.selectFrom(zdSimulLog)
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPage() :: list")
                .where(whereList.toArray(new BooleanExpression[0]))
                .orderBy(zdSimulLog.regDate.desc())
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();

        Long total = queryFactory.select(zdSimulLog.count())
                .from(zdSimulLog)
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPage() :: cnt")
                .where(whereList.toArray(new BooleanExpression[0]))
                .fetchOne();

        return new PageImpl<>(content, pageable, total != null ? total : 0L);
    }
}

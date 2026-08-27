package com.shopjoy.ecadminapi.md.cb.repository.qrydsl.impl;

import com.querydsl.jpa.impl.JPAQueryFactory;
import com.shopjoy.ecadminapi.md.cb.data.entity.MdCbPatternYarn;
import com.shopjoy.ecadminapi.md.cb.data.entity.QMdCbPatternYarn;
import com.shopjoy.ecadminapi.md.cb.repository.qrydsl.QMdCbPatternYarnRepository;
import lombok.RequiredArgsConstructor;

import java.util.List;

/** MdCbPatternYarn(도안-실 매핑) QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QMdCbPatternYarnRepositoryImpl implements QMdCbPatternYarnRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "md.cb.repository.qrydsl.impl.QMdCbPatternYarnRepositoryImpl";
    private static final QMdCbPatternYarn mdCbPatternYarn = QMdCbPatternYarn.mdCbPatternYarn;

    @Override
    public List<MdCbPatternYarn> selectListByPatternId(String patternId) {
        return queryFactory.selectFrom(mdCbPatternYarn)
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectListByPatternId()")
                .where(mdCbPatternYarn.patternId.eq(patternId))
                .orderBy(mdCbPatternYarn.regDate.asc())
                .fetch();
    }
}

package com.shopjoy.ecadminapi.md.cb.repository.qrydsl.impl;

import com.querydsl.jpa.impl.JPAQueryFactory;
import com.shopjoy.ecadminapi.md.cb.data.entity.MdCbPatternCell;
import com.shopjoy.ecadminapi.md.cb.data.entity.QMdCbPatternCell;
import com.shopjoy.ecadminapi.md.cb.repository.qrydsl.QMdCbPatternCellRepository;
import lombok.RequiredArgsConstructor;

import java.util.List;

/** MdCbPatternCell(도안 격자 셀) QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QMdCbPatternCellRepositoryImpl implements QMdCbPatternCellRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "md.cb.repository.qrydsl.impl.QMdCbPatternCellRepositoryImpl";
    private static final QMdCbPatternCell mdCbPatternCell = QMdCbPatternCell.mdCbPatternCell;

    @Override
    public List<MdCbPatternCell> selectListByPatternId(String patternId) {
        return queryFactory.selectFrom(mdCbPatternCell)
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectListByPatternId()")
                .where(mdCbPatternCell.patternId.eq(patternId))
                .orderBy(mdCbPatternCell.rowNo.asc(), mdCbPatternCell.colNo.asc())
                .fetch();
    }
}

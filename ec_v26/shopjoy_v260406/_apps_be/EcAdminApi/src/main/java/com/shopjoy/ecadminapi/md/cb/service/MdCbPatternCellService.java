package com.shopjoy.ecadminapi.md.cb.service;

import com.shopjoy.ecadminapi.md.cb.data.dto.MdCbPatternCellDto;
import com.shopjoy.ecadminapi.md.cb.data.entity.MdCbPatternCell;
import com.shopjoy.ecadminapi.md.cb.repository.MdCbPatternCellRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * MdCbPatternCell — 도안 격자 셀. 개별 CRUD 대신 도안(patternId) 단위 전체 교체(replaceAll)로만 다룬다
 * (프론트에서 격자 편집 후 [저장] 시 현재 화면 상태 전체를 한 번에 보낸다).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MdCbPatternCellService {

    private final MdCbPatternCellRepository mdCbPatternCellRepository;

    @PersistenceContext
    private EntityManager em;

    public List<MdCbPatternCellDto.Item> getByPatternId(String patternId) {
        CmUtil.requireId(patternId, "patternId", this);
        return mdCbPatternCellRepository.selectListByPatternId(patternId).stream()
            .map(e -> {
                MdCbPatternCellDto.Item item = new MdCbPatternCellDto.Item();
                item.setCellId(e.getCellId());
                item.setPatternId(e.getPatternId());
                item.setRowNo(e.getRowNo());
                item.setColNo(e.getColNo());
                item.setSymbolId(e.getSymbolId());
                item.setColorHex(e.getColorHex());
                return item;
            }).toList();
    }

    /** replaceAll — 이 도안의 기존 셀을 모두 지우고 넘어온 rows로 다시 채운다(전체 교체 저장) */
    @Transactional
    public void replaceAll(String patternId, List<MdCbPatternCell> rows) {
        CmUtil.requireId(patternId, "patternId", this);
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        mdCbPatternCellRepository.deleteByPatternId(patternId);
        em.flush();

        for (MdCbPatternCell row : rows) {
            if (row.getRowNo() == null || row.getColNo() == null || row.getSymbolId() == null) {
                throw new CmBizException("격자 셀에 rowNo/colNo/symbolId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
            }
            row.setCellId(CmUtil.generateId("cb_pattern_cell"));
            row.setPatternId(patternId);
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
        }
        mdCbPatternCellRepository.saveAll(rows);

        em.flush();
        em.clear();
    }
}

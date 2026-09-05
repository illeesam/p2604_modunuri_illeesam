package com.shopjoy.ecBeBo.md.cb.service;

import com.shopjoy.ecBeBo.md.cb.data.dto.MdCbPatternYarnDto;
import com.shopjoy.ecBeBo.md.cb.data.entity.MdCbPatternYarn;
import com.shopjoy.ecBeBo.md.cb.repository.MdCbPatternYarnRepository;
import com.shopjoy.ecBeBo.common.exception.CmBizException;
import com.shopjoy.ecBeBo.common.util.CmUtil;
import com.shopjoy.ecBeBo.common.util.SecurityUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * MdCbPatternYarn — 도안-실 매핑(재료 목록). 개별 CRUD 대신 도안(patternId) 단위 전체 교체(replaceAll)로만
 * 다룬다(프론트에서 재료 목록 편집 후 [저장] 시 현재 화면 상태 전체를 한 번에 보낸다). MdCbPatternCellService 와 동일 패턴.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MdCbPatternYarnService {

    private final MdCbPatternYarnRepository mdCbPatternYarnRepository;

    @PersistenceContext
    private EntityManager em;

    public List<MdCbPatternYarnDto.Item> getByPatternId(String patternId) {
        CmUtil.requireId(patternId, "patternId", this);
        // [쿼리 메서드] 도안-실 매핑 (도안별 사용 실 목록) 조건별 조회
        return mdCbPatternYarnRepository.findByPatternIdOrderByRegDateAsc(patternId).stream()
            .map(e -> {
                MdCbPatternYarnDto.Item item = new MdCbPatternYarnDto.Item();
                item.setPatternYarnId(e.getPatternYarnId());
                item.setPatternId(e.getPatternId());
                item.setYarnId(e.getYarnId());
                item.setUsageDesc(e.getUsageDesc());
                return item;
            }).toList();
    }

    /** replaceAll — 이 도안의 기존 재료(실) 목록을 모두 지우고 넘어온 rows로 다시 채운다(전체 교체 저장) */
    @Transactional
    public void replaceAll(String patternId, List<MdCbPatternYarn> rows) {
        CmUtil.requireId(patternId, "patternId", this);
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // [쿼리 메서드] 도안-실 매핑 전체 삭제
        mdCbPatternYarnRepository.deleteByPatternId(patternId);
        em.flush();

        for (MdCbPatternYarn row : rows) {
            if (row.getYarnId() == null) {
                throw new CmBizException("재료 목록에 yarnId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
            }
            row.setPatternYarnId(CmUtil.generateId("cb_pattern_yarn"));
            row.setPatternId(patternId);
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
        }
        // [쿼리 메서드] 도안-실 매핑 (도안별 사용 실 목록) 일괄 저장
        mdCbPatternYarnRepository.saveAll(rows);

        em.flush();
        em.clear();
    }
}

package com.shopjoy.ecadminapi.bo.ec.dp.service;

import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpPanelDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpPanel;
import com.shopjoy.ecadminapi.base.ec.dp.mapper.DpPanelMapper;
import com.shopjoy.ecadminapi.base.ec.dp.repository.DpPanelRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import com.shopjoy.ecadminapi.common.util.VoUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class BoDpPanelService {
    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");
    private final DpPanelMapper dpPanelMapper;
    private final DpPanelRepository dpPanelRepository;
    @PersistenceContext
    private EntityManager em;

    @Transactional(readOnly = true)
    public List<DpPanelDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        return dpPanelMapper.selectList(p);
    }

    @Transactional(readOnly = true)
    public PageResult<DpPanelDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(dpPanelMapper.selectPageList(p), dpPanelMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional(readOnly = true)
    public DpPanelDto getById(String id) {
        DpPanelDto dto = dpPanelMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    @Transactional
    public DpPanel create(DpPanel body) {
        if (body.getUseYn() == null) body.setUseYn("Y");
        body.setPanelId("PN" + LocalDateTime.now().format(ID_FMT) + String.format("%04d", (int)(Math.random()*10000)));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        DpPanel saved = dpPanelRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        return saved;
    }

    @Transactional
    public DpPanelDto update(String id, DpPanel body) {
        DpPanel entity = dpPanelRepository.findById(id).orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        VoUtil.voCopyExclude(body, entity, "panelId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        DpPanel saved = dpPanelRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return getById(id);
    }

    @Transactional
    public void delete(String id) {
        DpPanel entity = dpPanelRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        dpPanelRepository.delete(entity);
        em.flush();
        if (dpPanelRepository.existsById(id))
            throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public void saveList(List<DpPanel> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄 처리
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getPanelId() != null)
            .map(DpPanel::getPanelId)
            .toList();
        if (!deleteIds.isEmpty()) {
            dpPanelRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }

        // 2단계: UPDATE 처리
        for (DpPanel row : rows) {
            if (!"U".equals(row.getRowStatus())) continue;
            String id = Objects.requireNonNull(row.getPanelId(), "panelId must not be null");
            DpPanel entity = dpPanelRepository.findById(id)
                .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
            VoUtil.voCopyExclude(row, entity, "panelId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            dpPanelRepository.save(entity);
        }
        em.flush();

        // 3단계: INSERT 처리
        for (DpPanel row : rows) {
            if (!"I".equals(row.getRowStatus())) continue;
            row.setPanelId("PN" + now.format(ID_FMT) + String.format("%04d", (int)(Math.random()*10000)));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            dpPanelRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}

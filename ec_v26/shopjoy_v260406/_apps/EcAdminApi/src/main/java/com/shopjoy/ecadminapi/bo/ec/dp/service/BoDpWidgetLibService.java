package com.shopjoy.ecadminapi.bo.ec.dp.service;

import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpWidgetLibDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpWidgetLib;
import com.shopjoy.ecadminapi.base.ec.dp.mapper.DpWidgetLibMapper;
import com.shopjoy.ecadminapi.base.ec.dp.repository.DpWidgetLibRepository;
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
public class BoDpWidgetLibService {
    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");
    private final DpWidgetLibMapper dpWidgetLibMapper;
    private final DpWidgetLibRepository dpWidgetLibRepository;
    @PersistenceContext
    private EntityManager em;

    @Transactional(readOnly = true)
    public List<DpWidgetLibDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        return dpWidgetLibMapper.selectList(p);
    }

    @Transactional(readOnly = true)
    public PageResult<DpWidgetLibDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(dpWidgetLibMapper.selectPageList(p), dpWidgetLibMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional(readOnly = true)
    public DpWidgetLibDto getById(String id) {
        DpWidgetLibDto dto = dpWidgetLibMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    @Transactional
    public DpWidgetLib create(DpWidgetLib body) {
        if (body.getUseYn() == null) body.setUseYn("Y");
        body.setWidgetLibId("WL" + LocalDateTime.now().format(ID_FMT) + String.format("%04d", (int)(Math.random()*10000)));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        DpWidgetLib saved = dpWidgetLibRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        return saved;
    }

    @Transactional
    public DpWidgetLibDto update(String id, DpWidgetLib body) {
        DpWidgetLib entity = dpWidgetLibRepository.findById(id).orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        VoUtil.voCopyExclude(body, entity, "widgetLibId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        DpWidgetLib saved = dpWidgetLibRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return getById(id);
    }

    @Transactional
    public void delete(String id) {
        DpWidgetLib entity = dpWidgetLibRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        dpWidgetLibRepository.delete(entity);
        em.flush();
        if (dpWidgetLibRepository.existsById(id))
            throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public void saveList(List<DpWidgetLib> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄 처리
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getWidgetLibId() != null)
            .map(DpWidgetLib::getWidgetLibId)
            .toList();
        if (!deleteIds.isEmpty()) {
            dpWidgetLibRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }

        // 2단계: UPDATE 처리
        for (DpWidgetLib row : rows) {
            if (!"U".equals(row.getRowStatus())) continue;
            String id = Objects.requireNonNull(row.getWidgetLibId(), "widgetLibId must not be null");
            DpWidgetLib entity = dpWidgetLibRepository.findById(id)
                .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
            VoUtil.voCopyExclude(row, entity, "widgetLibId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            dpWidgetLibRepository.save(entity);
        }
        em.flush();

        // 3단계: INSERT 처리
        for (DpWidgetLib row : rows) {
            if (!"I".equals(row.getRowStatus())) continue;
            row.setWidgetLibId("WL" + now.format(ID_FMT) + String.format("%04d", (int)(Math.random()*10000)));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            dpWidgetLibRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}

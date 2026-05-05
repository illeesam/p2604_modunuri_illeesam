package com.shopjoy.ecadminapi.bo.ec.dp.service;

import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpAreaDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpArea;
import com.shopjoy.ecadminapi.base.ec.dp.mapper.DpAreaMapper;
import com.shopjoy.ecadminapi.base.ec.dp.repository.DpAreaRepository;
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
public class BoDpAreaService {
    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");
    private final DpAreaMapper dpAreaMapper;
    private final DpAreaRepository dpAreaRepository;
    @PersistenceContext
    private EntityManager em;

    @Transactional(readOnly = true)
    public List<DpAreaDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        return dpAreaMapper.selectList(p);
    }

    @Transactional(readOnly = true)
    public PageResult<DpAreaDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(dpAreaMapper.selectPageList(p), dpAreaMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional(readOnly = true)
    public DpAreaDto getById(String id) {
        DpAreaDto dto = dpAreaMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    @Transactional
    public DpArea create(DpArea body) {
        if (body.getUseYn() == null) body.setUseYn("Y");
        body.setAreaId("AR" + LocalDateTime.now().format(ID_FMT) + String.format("%04d", (int)(Math.random()*10000)));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        DpArea saved = dpAreaRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        return saved;
    }

    @Transactional
    public DpAreaDto update(String id, DpArea body) {
        DpArea entity = dpAreaRepository.findById(id).orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        VoUtil.voCopyExclude(body, entity, "areaId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        DpArea saved = dpAreaRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return getById(id);
    }

    @Transactional
    public void delete(String id) {
        DpArea entity = dpAreaRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        dpAreaRepository.delete(entity);
        em.flush();
        if (dpAreaRepository.existsById(id))
            throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public void saveList(List<DpArea> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄 처리
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getAreaId() != null)
            .map(DpArea::getAreaId)
            .toList();
        if (!deleteIds.isEmpty()) {
            dpAreaRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }

        // 2단계: UPDATE 처리
        for (DpArea row : rows) {
            if (!"U".equals(row.getRowStatus())) continue;
            String id = Objects.requireNonNull(row.getAreaId(), "areaId must not be null");
            DpArea entity = dpAreaRepository.findById(id)
                .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
            VoUtil.voCopyExclude(row, entity, "areaId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            dpAreaRepository.save(entity);
        }
        em.flush();

        // 3단계: INSERT 처리
        for (DpArea row : rows) {
            if (!"I".equals(row.getRowStatus())) continue;
            row.setAreaId("AR" + now.format(ID_FMT) + String.format("%04d", (int)(Math.random()*10000)));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            dpAreaRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}

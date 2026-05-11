package com.shopjoy.ecadminapi.base.ec.dp.service;

import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpUiAreaDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpUiArea;
import com.shopjoy.ecadminapi.base.ec.dp.mapper.DpUiAreaMapper;
import com.shopjoy.ecadminapi.base.ec.dp.repository.DpUiAreaRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import com.shopjoy.ecadminapi.common.util.VoUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DpUiAreaService {

    private final DpUiAreaMapper dpUiAreaMapper;
    private final DpUiAreaRepository dpUiAreaRepository;

    @PersistenceContext
    private EntityManager em;

    public DpUiAreaDto.Item getById(String id) {
        DpUiAreaDto.Item dto = dpUiAreaMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public DpUiArea findById(String id) {
        return dpUiAreaRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return dpUiAreaRepository.existsById(id);
    }

    public List<DpUiAreaDto.Item> getList(DpUiAreaDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return dpUiAreaMapper.selectList(VoUtil.voToMap(req));
    }

    public DpUiAreaDto.PageResponse getPageData(DpUiAreaDto.Request req) {
        PageHelper.addPaging(req);
        DpUiAreaDto.PageResponse res = new DpUiAreaDto.PageResponse();
        List<DpUiAreaDto.Item> list = dpUiAreaMapper.selectPageList(VoUtil.voToMap(req));
        long count = dpUiAreaMapper.selectPageCount(VoUtil.voToMap(req));
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public DpUiArea create(DpUiArea body) {
        body.setUiAreaId(CmUtil.generateId("dp_ui_area"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        DpUiArea saved = dpUiAreaRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public DpUiArea save(DpUiArea entity) {
        if (!existsById(entity.getUiAreaId()))
            throw new CmBizException("존재하지 않는 DpUiArea입니다: " + entity.getUiAreaId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        DpUiArea saved = dpUiAreaRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public DpUiArea update(String id, DpUiArea body) {
        DpUiArea entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "uiAreaId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        DpUiArea saved = dpUiAreaRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public DpUiArea updateSelective(DpUiArea entity) {
        if (entity.getUiAreaId() == null) throw new CmBizException("uiAreaId 가 필요합니다.");
        if (!existsById(entity.getUiAreaId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getUiAreaId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = dpUiAreaMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        DpUiArea entity = findById(id);
        dpUiAreaRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public void saveList(List<DpUiArea> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getUiAreaId() != null)
            .map(DpUiArea::getUiAreaId)
            .toList();
        if (!deleteIds.isEmpty()) {
            dpUiAreaRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<DpUiArea> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getUiAreaId() != null)
            .toList();
        for (DpUiArea row : updateRows) {
            DpUiArea entity = findById(row.getUiAreaId());
            VoUtil.voCopyExclude(row, entity, "uiAreaId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            dpUiAreaRepository.save(entity);
        }
        em.flush();

        List<DpUiArea> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (DpUiArea row : insertRows) {
            row.setUiAreaId(CmUtil.generateId("dp_ui_area"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            dpUiAreaRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}

package com.shopjoy.ecadminapi.base.ec.dp.service;

import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpAreaDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpArea;
import com.shopjoy.ecadminapi.base.ec.dp.mapper.DpAreaMapper;
import com.shopjoy.ecadminapi.base.ec.dp.repository.DpAreaRepository;
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
public class DpAreaService {

    private final DpAreaMapper dpAreaMapper;
    private final DpAreaRepository dpAreaRepository;

    @PersistenceContext
    private EntityManager em;

    public DpAreaDto.Item getById(String id) {
        DpAreaDto.Item dto = dpAreaMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public DpArea findById(String id) {
        return dpAreaRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return dpAreaRepository.existsById(id);
    }

    public List<DpAreaDto.Item> getList(DpAreaDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return dpAreaMapper.selectList(req);
    }

    public DpAreaDto.PageResponse getPageData(DpAreaDto.Request req) {
        PageHelper.addPaging(req);
        DpAreaDto.PageResponse res = new DpAreaDto.PageResponse();
        List<DpAreaDto.Item> list = dpAreaMapper.selectPageList(req);
        long count = dpAreaMapper.selectPageCount(req);
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public DpArea create(DpArea body) {
        body.setAreaId(CmUtil.generateId("dp_area"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        DpArea saved = dpAreaRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public DpArea save(DpArea entity) {
        if (!existsById(entity.getAreaId()))
            throw new CmBizException("존재하지 않는 DpArea입니다: " + entity.getAreaId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        DpArea saved = dpAreaRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public DpArea update(String id, DpArea body) {
        DpArea entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "areaId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        DpArea saved = dpAreaRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public DpArea updatePartial(DpArea entity) {
        if (entity.getAreaId() == null) throw new CmBizException("areaId 가 필요합니다.");
        if (!existsById(entity.getAreaId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getAreaId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = dpAreaMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        DpArea entity = findById(id);
        dpAreaRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public void saveList(List<DpArea> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getAreaId() != null)
            .map(DpArea::getAreaId)
            .toList();
        if (!deleteIds.isEmpty()) {
            dpAreaRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<DpArea> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getAreaId() != null)
            .toList();
        for (DpArea row : updateRows) {
            DpArea entity = findById(row.getAreaId());
            VoUtil.voCopyExclude(row, entity, "areaId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            dpAreaRepository.save(entity);
        }
        em.flush();

        List<DpArea> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (DpArea row : insertRows) {
            row.setAreaId(CmUtil.generateId("dp_area"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            dpAreaRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}

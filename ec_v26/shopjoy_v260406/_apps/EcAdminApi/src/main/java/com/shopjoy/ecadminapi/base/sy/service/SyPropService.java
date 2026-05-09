package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyPropDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyProp;
import com.shopjoy.ecadminapi.base.sy.mapper.SyPropMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyPropRepository;
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
public class SyPropService {

    private final SyPropMapper syPropMapper;
    private final SyPropRepository syPropRepository;

    @PersistenceContext
    private EntityManager em;

    public SyPropDto.Item getById(String id) {
        SyPropDto.Item dto = syPropMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public SyProp findById(String id) {
        return syPropRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return syPropRepository.existsById(id);
    }

    public List<SyPropDto.Item> getList(SyPropDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return syPropMapper.selectList(req);
    }

    public SyPropDto.PageResponse getPageData(SyPropDto.Request req) {
        PageHelper.addPaging(req);
        SyPropDto.PageResponse res = new SyPropDto.PageResponse();
        List<SyPropDto.Item> list = syPropMapper.selectPageList(req);
        long count = syPropMapper.selectPageCount(req);
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public SyProp create(SyProp body) {
        body.setPropId(CmUtil.generateId("sy_prop"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        SyProp saved = syPropRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public SyProp save(SyProp entity) {
        if (!existsById(entity.getPropId()))
            throw new CmBizException("존재하지 않는 SyProp입니다: " + entity.getPropId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyProp saved = syPropRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public SyProp update(String id, SyProp body) {
        SyProp entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "propId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyProp saved = syPropRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public SyProp updatePartial(SyProp entity) {
        if (entity.getPropId() == null) throw new CmBizException("propId 가 필요합니다.");
        if (!existsById(entity.getPropId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getPropId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = syPropMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        SyProp entity = findById(id);
        syPropRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public void saveList(List<SyProp> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getPropId() != null)
            .map(SyProp::getPropId)
            .toList();
        if (!deleteIds.isEmpty()) {
            syPropRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<SyProp> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getPropId() != null)
            .toList();
        for (SyProp row : updateRows) {
            SyProp entity = findById(row.getPropId());
            VoUtil.voCopyExclude(row, entity, "propId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            syPropRepository.save(entity);
        }
        em.flush();

        List<SyProp> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (SyProp row : insertRows) {
            row.setPropId(CmUtil.generateId("sy_prop"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            syPropRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}

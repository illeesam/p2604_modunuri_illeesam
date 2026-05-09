package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyAttachGrpDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyAttachGrp;
import com.shopjoy.ecadminapi.base.sy.mapper.SyAttachGrpMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyAttachGrpRepository;
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
public class SyAttachGrpService {

    private final SyAttachGrpMapper syAttachGrpMapper;
    private final SyAttachGrpRepository syAttachGrpRepository;

    @PersistenceContext
    private EntityManager em;

    public SyAttachGrpDto.Item getById(String id) {
        SyAttachGrpDto.Item dto = syAttachGrpMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public SyAttachGrp findById(String id) {
        return syAttachGrpRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return syAttachGrpRepository.existsById(id);
    }

    public List<SyAttachGrpDto.Item> getList(SyAttachGrpDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return syAttachGrpMapper.selectList(req);
    }

    public SyAttachGrpDto.PageResponse getPageData(SyAttachGrpDto.Request req) {
        PageHelper.addPaging(req);
        SyAttachGrpDto.PageResponse res = new SyAttachGrpDto.PageResponse();
        List<SyAttachGrpDto.Item> list = syAttachGrpMapper.selectPageList(req);
        long count = syAttachGrpMapper.selectPageCount(req);
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public SyAttachGrp create(SyAttachGrp body) {
        body.setAttachGrpId(CmUtil.generateId("sy_attach_grp"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        SyAttachGrp saved = syAttachGrpRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public SyAttachGrp save(SyAttachGrp entity) {
        if (!existsById(entity.getAttachGrpId()))
            throw new CmBizException("존재하지 않는 SyAttachGrp입니다: " + entity.getAttachGrpId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyAttachGrp saved = syAttachGrpRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public SyAttachGrp update(String id, SyAttachGrp body) {
        SyAttachGrp entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "attachGrpId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyAttachGrp saved = syAttachGrpRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public SyAttachGrp updatePartial(SyAttachGrp entity) {
        if (entity.getAttachGrpId() == null) throw new CmBizException("attachGrpId 가 필요합니다.");
        if (!existsById(entity.getAttachGrpId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getAttachGrpId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = syAttachGrpMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        SyAttachGrp entity = findById(id);
        syAttachGrpRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public void saveList(List<SyAttachGrp> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getAttachGrpId() != null)
            .map(SyAttachGrp::getAttachGrpId)
            .toList();
        if (!deleteIds.isEmpty()) {
            syAttachGrpRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<SyAttachGrp> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getAttachGrpId() != null)
            .toList();
        for (SyAttachGrp row : updateRows) {
            SyAttachGrp entity = findById(row.getAttachGrpId());
            VoUtil.voCopyExclude(row, entity, "attachGrpId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            syAttachGrpRepository.save(entity);
        }
        em.flush();

        List<SyAttachGrp> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (SyAttachGrp row : insertRows) {
            row.setAttachGrpId(CmUtil.generateId("sy_attach_grp"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            syAttachGrpRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}

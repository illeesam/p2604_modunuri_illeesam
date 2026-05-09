package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyAttachDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyAttach;
import com.shopjoy.ecadminapi.base.sy.mapper.SyAttachMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyAttachRepository;
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
public class SyAttachService {

    private final SyAttachMapper syAttachMapper;
    private final SyAttachRepository syAttachRepository;

    @PersistenceContext
    private EntityManager em;

    public SyAttachDto.Item getById(String id) {
        SyAttachDto.Item dto = syAttachMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public SyAttach findById(String id) {
        return syAttachRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return syAttachRepository.existsById(id);
    }

    public List<SyAttachDto.Item> getList(SyAttachDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return syAttachMapper.selectList(req);
    }

    public SyAttachDto.PageResponse getPageData(SyAttachDto.Request req) {
        PageHelper.addPaging(req);
        SyAttachDto.PageResponse res = new SyAttachDto.PageResponse();
        List<SyAttachDto.Item> list = syAttachMapper.selectPageList(req);
        long count = syAttachMapper.selectPageCount(req);
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public SyAttach create(SyAttach body) {
        body.setAttachId(CmUtil.generateId("sy_attach"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        SyAttach saved = syAttachRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(saved.getAttachId());
    }

    @Transactional
    public SyAttach save(SyAttach entity) {
        if (!existsById(entity.getAttachId()))
            throw new CmBizException("존재하지 않는 SyAttach입니다: " + entity.getAttachId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyAttach saved = syAttachRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(saved.getAttachId());
    }

    @Transactional
    public SyAttach update(String id, SyAttach body) {
        SyAttach entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "attachId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyAttach saved = syAttachRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(id);
    }

    @Transactional
    public SyAttach updatePartial(SyAttach entity) {
        if (entity.getAttachId() == null) throw new CmBizException("attachId 가 필요합니다.");
        if (!existsById(entity.getAttachId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getAttachId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = syAttachMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return findById(entity.getAttachId());
    }

    @Transactional
    public void delete(String id) {
        SyAttach entity = findById(id);
        syAttachRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public List<SyAttach> saveList(List<SyAttach> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getAttachId() != null)
            .map(SyAttach::getAttachId)
            .toList();
        if (!deleteIds.isEmpty()) {
            syAttachRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }

        List<String> upsertedIds = new ArrayList<>();
        List<SyAttach> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getAttachId() != null)
            .toList();
        for (SyAttach row : updateRows) {
            SyAttach entity = findById(row.getAttachId());
            VoUtil.voCopyExclude(row, entity, "attachId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            syAttachRepository.save(entity);
            upsertedIds.add(entity.getAttachId());
        }
        em.flush();

        List<SyAttach> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (SyAttach row : insertRows) {
            row.setAttachId(CmUtil.generateId("sy_attach"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            syAttachRepository.save(row);
            upsertedIds.add(row.getAttachId());
        }
        em.flush();
        em.clear();

        List<SyAttach> result = new ArrayList<>();
        for (String id : upsertedIds) {
            result.add(findById(id));
        }
        return result;
    }
}

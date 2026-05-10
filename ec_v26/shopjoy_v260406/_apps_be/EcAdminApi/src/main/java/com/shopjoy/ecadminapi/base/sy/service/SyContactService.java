package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyContactDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyContact;
import com.shopjoy.ecadminapi.base.sy.mapper.SyContactMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyContactRepository;
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
public class SyContactService {

    private final SyContactMapper syContactMapper;
    private final SyContactRepository syContactRepository;

    @PersistenceContext
    private EntityManager em;

    public SyContactDto.Item getById(String id) {
        SyContactDto.Item dto = syContactMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public SyContact findById(String id) {
        return syContactRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return syContactRepository.existsById(id);
    }

    public List<SyContactDto.Item> getList(SyContactDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return syContactMapper.selectList(VoUtil.voToMap(req));
    }

    public SyContactDto.PageResponse getPageData(SyContactDto.Request req) {
        PageHelper.addPaging(req);
        SyContactDto.PageResponse res = new SyContactDto.PageResponse();
        List<SyContactDto.Item> list = syContactMapper.selectPageList(VoUtil.voToMap(req));
        long count = syContactMapper.selectPageCount(VoUtil.voToMap(req));
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public SyContact create(SyContact body) {
        body.setContactId(CmUtil.generateId("sy_contact"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        SyContact saved = syContactRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public SyContact save(SyContact entity) {
        if (!existsById(entity.getContactId()))
            throw new CmBizException("존재하지 않는 SyContact입니다: " + entity.getContactId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyContact saved = syContactRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public SyContact update(String id, SyContact body) {
        SyContact entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "contactId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyContact saved = syContactRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public SyContact updatePartial(SyContact entity) {
        if (entity.getContactId() == null) throw new CmBizException("contactId 가 필요합니다.");
        if (!existsById(entity.getContactId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getContactId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = syContactMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        SyContact entity = findById(id);
        syContactRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public void saveList(List<SyContact> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getContactId() != null)
            .map(SyContact::getContactId)
            .toList();
        if (!deleteIds.isEmpty()) {
            syContactRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<SyContact> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getContactId() != null)
            .toList();
        for (SyContact row : updateRows) {
            SyContact entity = findById(row.getContactId());
            VoUtil.voCopyExclude(row, entity, "contactId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            syContactRepository.save(entity);
        }
        em.flush();

        List<SyContact> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (SyContact row : insertRows) {
            row.setContactId(CmUtil.generateId("sy_contact"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            syContactRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}

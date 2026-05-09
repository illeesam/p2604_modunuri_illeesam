package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyVocDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyVoc;
import com.shopjoy.ecadminapi.base.sy.mapper.SyVocMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyVocRepository;
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
public class SyVocService {

    private final SyVocMapper syVocMapper;
    private final SyVocRepository syVocRepository;

    @PersistenceContext
    private EntityManager em;

    public SyVocDto.Item getById(String id) {
        SyVocDto.Item dto = syVocMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public SyVoc findById(String id) {
        return syVocRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return syVocRepository.existsById(id);
    }

    public List<SyVocDto.Item> getList(SyVocDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return syVocMapper.selectList(VoUtil.voToMap(req));
    }

    public SyVocDto.PageResponse getPageData(SyVocDto.Request req) {
        PageHelper.addPaging(req);
        SyVocDto.PageResponse res = new SyVocDto.PageResponse();
        List<SyVocDto.Item> list = syVocMapper.selectPageList(VoUtil.voToMap(req));
        long count = syVocMapper.selectPageCount(VoUtil.voToMap(req));
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public SyVoc create(SyVoc body) {
        body.setVocId(CmUtil.generateId("sy_voc"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        SyVoc saved = syVocRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public SyVoc save(SyVoc entity) {
        if (!existsById(entity.getVocId()))
            throw new CmBizException("존재하지 않는 SyVoc입니다: " + entity.getVocId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyVoc saved = syVocRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public SyVoc update(String id, SyVoc body) {
        SyVoc entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "vocId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyVoc saved = syVocRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public SyVoc updatePartial(SyVoc entity) {
        if (entity.getVocId() == null) throw new CmBizException("vocId 가 필요합니다.");
        if (!existsById(entity.getVocId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getVocId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = syVocMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        SyVoc entity = findById(id);
        syVocRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public void saveList(List<SyVoc> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getVocId() != null)
            .map(SyVoc::getVocId)
            .toList();
        if (!deleteIds.isEmpty()) {
            syVocRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<SyVoc> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getVocId() != null)
            .toList();
        for (SyVoc row : updateRows) {
            SyVoc entity = findById(row.getVocId());
            VoUtil.voCopyExclude(row, entity, "vocId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            syVocRepository.save(entity);
        }
        em.flush();

        List<SyVoc> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (SyVoc row : insertRows) {
            row.setVocId(CmUtil.generateId("sy_voc"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            syVocRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}

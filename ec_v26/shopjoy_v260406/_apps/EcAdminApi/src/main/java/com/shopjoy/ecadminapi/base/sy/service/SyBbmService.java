package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyBbmDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyBbm;
import com.shopjoy.ecadminapi.base.sy.mapper.SyBbmMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyBbmRepository;
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
public class SyBbmService {

    private final SyBbmMapper syBbmMapper;
    private final SyBbmRepository syBbmRepository;

    @PersistenceContext
    private EntityManager em;

    public SyBbmDto.Item getById(String id) {
        SyBbmDto.Item dto = syBbmMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public SyBbm findById(String id) {
        return syBbmRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return syBbmRepository.existsById(id);
    }

    public List<SyBbmDto.Item> getList(SyBbmDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return syBbmMapper.selectList(req);
    }

    public SyBbmDto.PageResponse getPageData(SyBbmDto.Request req) {
        PageHelper.addPaging(req);
        SyBbmDto.PageResponse res = new SyBbmDto.PageResponse();
        List<SyBbmDto.Item> list = syBbmMapper.selectPageList(req);
        long count = syBbmMapper.selectPageCount(req);
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public SyBbm create(SyBbm body) {
        body.setBbmId(CmUtil.generateId("sy_bbm"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        SyBbm saved = syBbmRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public SyBbm save(SyBbm entity) {
        if (!existsById(entity.getBbmId()))
            throw new CmBizException("존재하지 않는 SyBbm입니다: " + entity.getBbmId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyBbm saved = syBbmRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public SyBbm update(String id, SyBbm body) {
        SyBbm entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "bbmId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyBbm saved = syBbmRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public SyBbm updatePartial(SyBbm entity) {
        if (entity.getBbmId() == null) throw new CmBizException("bbmId 가 필요합니다.");
        if (!existsById(entity.getBbmId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getBbmId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = syBbmMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        SyBbm entity = findById(id);
        syBbmRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public void saveList(List<SyBbm> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getBbmId() != null)
            .map(SyBbm::getBbmId)
            .toList();
        if (!deleteIds.isEmpty()) {
            syBbmRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<SyBbm> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getBbmId() != null)
            .toList();
        for (SyBbm row : updateRows) {
            SyBbm entity = findById(row.getBbmId());
            VoUtil.voCopyExclude(row, entity, "bbmId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            syBbmRepository.save(entity);
        }
        em.flush();

        List<SyBbm> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (SyBbm row : insertRows) {
            row.setBbmId(CmUtil.generateId("sy_bbm"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            syBbmRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}

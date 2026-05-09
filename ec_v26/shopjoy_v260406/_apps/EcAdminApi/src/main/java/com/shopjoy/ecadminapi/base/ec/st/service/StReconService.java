package com.shopjoy.ecadminapi.base.ec.st.service;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StReconDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StRecon;
import com.shopjoy.ecadminapi.base.ec.st.mapper.StReconMapper;
import com.shopjoy.ecadminapi.base.ec.st.repository.StReconRepository;
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
public class StReconService {

    private final StReconMapper stReconMapper;
    private final StReconRepository stReconRepository;

    @PersistenceContext
    private EntityManager em;

    public StReconDto.Item getById(String id) {
        StReconDto.Item dto = stReconMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public StRecon findById(String id) {
        return stReconRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return stReconRepository.existsById(id);
    }

    public List<StReconDto.Item> getList(StReconDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return stReconMapper.selectList(VoUtil.voToMap(req));
    }

    public StReconDto.PageResponse getPageData(StReconDto.Request req) {
        PageHelper.addPaging(req);
        StReconDto.PageResponse res = new StReconDto.PageResponse();
        List<StReconDto.Item> list = stReconMapper.selectPageList(VoUtil.voToMap(req));
        long count = stReconMapper.selectPageCount(VoUtil.voToMap(req));
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public StRecon create(StRecon body) {
        body.setReconId(CmUtil.generateId("st_recon"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        StRecon saved = stReconRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public StRecon save(StRecon entity) {
        if (!existsById(entity.getReconId()))
            throw new CmBizException("존재하지 않는 StRecon입니다: " + entity.getReconId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        StRecon saved = stReconRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public StRecon update(String id, StRecon body) {
        StRecon entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "reconId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        StRecon saved = stReconRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public StRecon updatePartial(StRecon entity) {
        if (entity.getReconId() == null) throw new CmBizException("reconId 가 필요합니다.");
        if (!existsById(entity.getReconId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getReconId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = stReconMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        StRecon entity = findById(id);
        stReconRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public void saveList(List<StRecon> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getReconId() != null)
            .map(StRecon::getReconId)
            .toList();
        if (!deleteIds.isEmpty()) {
            stReconRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<StRecon> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getReconId() != null)
            .toList();
        for (StRecon row : updateRows) {
            StRecon entity = findById(row.getReconId());
            VoUtil.voCopyExclude(row, entity, "reconId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            stReconRepository.save(entity);
        }
        em.flush();

        List<StRecon> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (StRecon row : insertRows) {
            row.setReconId(CmUtil.generateId("st_recon"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            stReconRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}

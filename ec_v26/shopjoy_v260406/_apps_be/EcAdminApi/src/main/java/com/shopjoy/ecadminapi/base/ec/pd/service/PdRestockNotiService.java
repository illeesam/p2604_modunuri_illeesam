package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdRestockNotiDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdRestockNoti;
import com.shopjoy.ecadminapi.base.ec.pd.mapper.PdRestockNotiMapper;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdRestockNotiRepository;
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
public class PdRestockNotiService {

    private final PdRestockNotiMapper pdRestockNotiMapper;
    private final PdRestockNotiRepository pdRestockNotiRepository;

    @PersistenceContext
    private EntityManager em;

    public PdRestockNotiDto.Item getById(String id) {
        PdRestockNotiDto.Item dto = pdRestockNotiMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public PdRestockNoti findById(String id) {
        return pdRestockNotiRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return pdRestockNotiRepository.existsById(id);
    }

    public List<PdRestockNotiDto.Item> getList(PdRestockNotiDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return pdRestockNotiMapper.selectList(VoUtil.voToMap(req));
    }

    public PdRestockNotiDto.PageResponse getPageData(PdRestockNotiDto.Request req) {
        PageHelper.addPaging(req);
        PdRestockNotiDto.PageResponse res = new PdRestockNotiDto.PageResponse();
        List<PdRestockNotiDto.Item> list = pdRestockNotiMapper.selectPageList(VoUtil.voToMap(req));
        long count = pdRestockNotiMapper.selectPageCount(VoUtil.voToMap(req));
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public PdRestockNoti create(PdRestockNoti body) {
        body.setRestockNotiId(CmUtil.generateId("pd_restock_noti"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PdRestockNoti saved = pdRestockNotiRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public PdRestockNoti save(PdRestockNoti entity) {
        if (!existsById(entity.getRestockNotiId()))
            throw new CmBizException("존재하지 않는 PdRestockNoti입니다: " + entity.getRestockNotiId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PdRestockNoti saved = pdRestockNotiRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public PdRestockNoti update(String id, PdRestockNoti body) {
        PdRestockNoti entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "restockNotiId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PdRestockNoti saved = pdRestockNotiRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public PdRestockNoti updateSelective(PdRestockNoti entity) {
        if (entity.getRestockNotiId() == null) throw new CmBizException("restockNotiId 가 필요합니다.");
        if (!existsById(entity.getRestockNotiId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getRestockNotiId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = pdRestockNotiMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        PdRestockNoti entity = findById(id);
        pdRestockNotiRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public void saveList(List<PdRestockNoti> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getRestockNotiId() != null)
            .map(PdRestockNoti::getRestockNotiId)
            .toList();
        if (!deleteIds.isEmpty()) {
            pdRestockNotiRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<PdRestockNoti> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getRestockNotiId() != null)
            .toList();
        for (PdRestockNoti row : updateRows) {
            PdRestockNoti entity = findById(row.getRestockNotiId());
            VoUtil.voCopyExclude(row, entity, "restockNotiId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            pdRestockNotiRepository.save(entity);
        }
        em.flush();

        List<PdRestockNoti> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (PdRestockNoti row : insertRows) {
            row.setRestockNotiId(CmUtil.generateId("pd_restock_noti"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            pdRestockNotiRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}

package com.shopjoy.ecadminapi.base.ec.st.service;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettle;
import com.shopjoy.ecadminapi.base.ec.st.mapper.StSettleMapper;
import com.shopjoy.ecadminapi.base.ec.st.repository.StSettleRepository;
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
public class StSettleService {

    private final StSettleMapper stSettleMapper;
    private final StSettleRepository stSettleRepository;

    @PersistenceContext
    private EntityManager em;

    public StSettleDto.Item getById(String id) {
        StSettleDto.Item dto = stSettleMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public StSettle findById(String id) {
        return stSettleRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return stSettleRepository.existsById(id);
    }

    public List<StSettleDto.Item> getList(StSettleDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return stSettleMapper.selectList(VoUtil.voToMap(req));
    }

    public StSettleDto.PageResponse getPageData(StSettleDto.Request req) {
        PageHelper.addPaging(req);
        StSettleDto.PageResponse res = new StSettleDto.PageResponse();
        List<StSettleDto.Item> list = stSettleMapper.selectPageList(VoUtil.voToMap(req));
        long count = stSettleMapper.selectPageCount(VoUtil.voToMap(req));
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public StSettle create(StSettle body) {
        body.setSettleId(CmUtil.generateId("st_settle"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        StSettle saved = stSettleRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public StSettle save(StSettle entity) {
        if (!existsById(entity.getSettleId()))
            throw new CmBizException("존재하지 않는 StSettle입니다: " + entity.getSettleId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        StSettle saved = stSettleRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public StSettle update(String id, StSettle body) {
        StSettle entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "settleId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        StSettle saved = stSettleRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public StSettle updateSelective(StSettle entity) {
        if (entity.getSettleId() == null) throw new CmBizException("settleId 가 필요합니다.");
        if (!existsById(entity.getSettleId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getSettleId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = stSettleMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        StSettle entity = findById(id);
        stSettleRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public void saveList(List<StSettle> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getSettleId() != null)
            .map(StSettle::getSettleId)
            .toList();
        if (!deleteIds.isEmpty()) {
            stSettleRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<StSettle> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getSettleId() != null)
            .toList();
        for (StSettle row : updateRows) {
            StSettle entity = findById(row.getSettleId());
            VoUtil.voCopyExclude(row, entity, "settleId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            stSettleRepository.save(entity);
        }
        em.flush();

        List<StSettle> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (StSettle row : insertRows) {
            row.setSettleId(CmUtil.generateId("st_settle"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            stSettleRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}

package com.shopjoy.ecadminapi.base.ec.st.service;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleEtcAdjDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleEtcAdj;
import com.shopjoy.ecadminapi.base.ec.st.mapper.StSettleEtcAdjMapper;
import com.shopjoy.ecadminapi.base.ec.st.repository.StSettleEtcAdjRepository;
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
public class StSettleEtcAdjService {

    private final StSettleEtcAdjMapper stSettleEtcAdjMapper;
    private final StSettleEtcAdjRepository stSettleEtcAdjRepository;

    @PersistenceContext
    private EntityManager em;

    public StSettleEtcAdjDto.Item getById(String id) {
        StSettleEtcAdjDto.Item dto = stSettleEtcAdjMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public StSettleEtcAdj findById(String id) {
        return stSettleEtcAdjRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return stSettleEtcAdjRepository.existsById(id);
    }

    public List<StSettleEtcAdjDto.Item> getList(StSettleEtcAdjDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return stSettleEtcAdjMapper.selectList(VoUtil.voToMap(req));
    }

    public StSettleEtcAdjDto.PageResponse getPageData(StSettleEtcAdjDto.Request req) {
        PageHelper.addPaging(req);
        StSettleEtcAdjDto.PageResponse res = new StSettleEtcAdjDto.PageResponse();
        List<StSettleEtcAdjDto.Item> list = stSettleEtcAdjMapper.selectPageList(VoUtil.voToMap(req));
        long count = stSettleEtcAdjMapper.selectPageCount(VoUtil.voToMap(req));
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public StSettleEtcAdj create(StSettleEtcAdj body) {
        body.setSettleEtcAdjId(CmUtil.generateId("st_settle_etc_adj"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        StSettleEtcAdj saved = stSettleEtcAdjRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public StSettleEtcAdj save(StSettleEtcAdj entity) {
        if (!existsById(entity.getSettleEtcAdjId()))
            throw new CmBizException("존재하지 않는 StSettleEtcAdj입니다: " + entity.getSettleEtcAdjId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        StSettleEtcAdj saved = stSettleEtcAdjRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public StSettleEtcAdj update(String id, StSettleEtcAdj body) {
        StSettleEtcAdj entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "settleEtcAdjId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        StSettleEtcAdj saved = stSettleEtcAdjRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public StSettleEtcAdj updateSelective(StSettleEtcAdj entity) {
        if (entity.getSettleEtcAdjId() == null) throw new CmBizException("settleEtcAdjId 가 필요합니다.");
        if (!existsById(entity.getSettleEtcAdjId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getSettleEtcAdjId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = stSettleEtcAdjMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        StSettleEtcAdj entity = findById(id);
        stSettleEtcAdjRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public void saveList(List<StSettleEtcAdj> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getSettleEtcAdjId() != null)
            .map(StSettleEtcAdj::getSettleEtcAdjId)
            .toList();
        if (!deleteIds.isEmpty()) {
            stSettleEtcAdjRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<StSettleEtcAdj> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getSettleEtcAdjId() != null)
            .toList();
        for (StSettleEtcAdj row : updateRows) {
            StSettleEtcAdj entity = findById(row.getSettleEtcAdjId());
            VoUtil.voCopyExclude(row, entity, "settleEtcAdjId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            stSettleEtcAdjRepository.save(entity);
        }
        em.flush();

        List<StSettleEtcAdj> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (StSettleEtcAdj row : insertRows) {
            row.setSettleEtcAdjId(CmUtil.generateId("st_settle_etc_adj"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            stSettleEtcAdjRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}

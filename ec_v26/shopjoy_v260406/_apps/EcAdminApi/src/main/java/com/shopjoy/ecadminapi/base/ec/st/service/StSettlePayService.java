package com.shopjoy.ecadminapi.base.ec.st.service;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettlePayDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettlePay;
import com.shopjoy.ecadminapi.base.ec.st.mapper.StSettlePayMapper;
import com.shopjoy.ecadminapi.base.ec.st.repository.StSettlePayRepository;
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
public class StSettlePayService {

    private final StSettlePayMapper stSettlePayMapper;
    private final StSettlePayRepository stSettlePayRepository;

    @PersistenceContext
    private EntityManager em;

    public StSettlePayDto.Item getById(String id) {
        StSettlePayDto.Item dto = stSettlePayMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public StSettlePay findById(String id) {
        return stSettlePayRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return stSettlePayRepository.existsById(id);
    }

    public List<StSettlePayDto.Item> getList(StSettlePayDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return stSettlePayMapper.selectList(req);
    }

    public StSettlePayDto.PageResponse getPageData(StSettlePayDto.Request req) {
        PageHelper.addPaging(req);
        StSettlePayDto.PageResponse res = new StSettlePayDto.PageResponse();
        List<StSettlePayDto.Item> list = stSettlePayMapper.selectPageList(req);
        long count = stSettlePayMapper.selectPageCount(req);
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public StSettlePay create(StSettlePay body) {
        body.setSettlePayId(CmUtil.generateId("st_settle_pay"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        StSettlePay saved = stSettlePayRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public StSettlePay save(StSettlePay entity) {
        if (!existsById(entity.getSettlePayId()))
            throw new CmBizException("존재하지 않는 StSettlePay입니다: " + entity.getSettlePayId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        StSettlePay saved = stSettlePayRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public StSettlePay update(String id, StSettlePay body) {
        StSettlePay entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "settlePayId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        StSettlePay saved = stSettlePayRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public StSettlePay updatePartial(StSettlePay entity) {
        if (entity.getSettlePayId() == null) throw new CmBizException("settlePayId 가 필요합니다.");
        if (!existsById(entity.getSettlePayId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getSettlePayId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = stSettlePayMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        StSettlePay entity = findById(id);
        stSettlePayRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public void saveList(List<StSettlePay> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getSettlePayId() != null)
            .map(StSettlePay::getSettlePayId)
            .toList();
        if (!deleteIds.isEmpty()) {
            stSettlePayRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<StSettlePay> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getSettlePayId() != null)
            .toList();
        for (StSettlePay row : updateRows) {
            StSettlePay entity = findById(row.getSettlePayId());
            VoUtil.voCopyExclude(row, entity, "settlePayId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            stSettlePayRepository.save(entity);
        }
        em.flush();

        List<StSettlePay> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (StSettlePay row : insertRows) {
            row.setSettlePayId(CmUtil.generateId("st_settle_pay"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            stSettlePayRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}

package com.shopjoy.ecadminapi.base.ec.st.service;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleRawDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleRaw;
import com.shopjoy.ecadminapi.base.ec.st.mapper.StSettleRawMapper;
import com.shopjoy.ecadminapi.base.ec.st.repository.StSettleRawRepository;
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
public class StSettleRawService {

    private final StSettleRawMapper stSettleRawMapper;
    private final StSettleRawRepository stSettleRawRepository;

    @PersistenceContext
    private EntityManager em;

    public StSettleRawDto.Item getById(String id) {
        StSettleRawDto.Item dto = stSettleRawMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public StSettleRaw findById(String id) {
        return stSettleRawRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return stSettleRawRepository.existsById(id);
    }

    public List<StSettleRawDto.Item> getList(StSettleRawDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return stSettleRawMapper.selectList(req);
    }

    public StSettleRawDto.PageResponse getPageData(StSettleRawDto.Request req) {
        PageHelper.addPaging(req);
        StSettleRawDto.PageResponse res = new StSettleRawDto.PageResponse();
        List<StSettleRawDto.Item> list = stSettleRawMapper.selectPageList(req);
        long count = stSettleRawMapper.selectPageCount(req);
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public StSettleRaw create(StSettleRaw body) {
        body.setSettleRawId(CmUtil.generateId("st_settle_raw"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        StSettleRaw saved = stSettleRawRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(saved.getSettleRawId());
    }

    @Transactional
    public StSettleRaw save(StSettleRaw entity) {
        if (!existsById(entity.getSettleRawId()))
            throw new CmBizException("존재하지 않는 StSettleRaw입니다: " + entity.getSettleRawId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        StSettleRaw saved = stSettleRawRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(saved.getSettleRawId());
    }

    @Transactional
    public StSettleRaw update(String id, StSettleRaw body) {
        StSettleRaw entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "settleRawId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        StSettleRaw saved = stSettleRawRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(id);
    }

    @Transactional
    public StSettleRaw updatePartial(StSettleRaw entity) {
        if (entity.getSettleRawId() == null) throw new CmBizException("settleRawId 가 필요합니다.");
        if (!existsById(entity.getSettleRawId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getSettleRawId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = stSettleRawMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return findById(entity.getSettleRawId());
    }

    @Transactional
    public void delete(String id) {
        StSettleRaw entity = findById(id);
        stSettleRawRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public List<StSettleRaw> saveList(List<StSettleRaw> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getSettleRawId() != null)
            .map(StSettleRaw::getSettleRawId)
            .toList();
        if (!deleteIds.isEmpty()) {
            stSettleRawRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }

        List<String> upsertedIds = new ArrayList<>();
        List<StSettleRaw> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getSettleRawId() != null)
            .toList();
        for (StSettleRaw row : updateRows) {
            StSettleRaw entity = findById(row.getSettleRawId());
            VoUtil.voCopyExclude(row, entity, "settleRawId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            stSettleRawRepository.save(entity);
            upsertedIds.add(entity.getSettleRawId());
        }
        em.flush();

        List<StSettleRaw> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (StSettleRaw row : insertRows) {
            row.setSettleRawId(CmUtil.generateId("st_settle_raw"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            stSettleRawRepository.save(row);
            upsertedIds.add(row.getSettleRawId());
        }
        em.flush();
        em.clear();

        List<StSettleRaw> result = new ArrayList<>();
        for (String id : upsertedIds) {
            result.add(findById(id));
        }
        return result;
    }
}

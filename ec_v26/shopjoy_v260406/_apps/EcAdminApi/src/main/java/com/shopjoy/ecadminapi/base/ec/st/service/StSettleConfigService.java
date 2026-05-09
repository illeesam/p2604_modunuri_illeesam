package com.shopjoy.ecadminapi.base.ec.st.service;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleConfigDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleConfig;
import com.shopjoy.ecadminapi.base.ec.st.mapper.StSettleConfigMapper;
import com.shopjoy.ecadminapi.base.ec.st.repository.StSettleConfigRepository;
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
public class StSettleConfigService {

    private final StSettleConfigMapper stSettleConfigMapper;
    private final StSettleConfigRepository stSettleConfigRepository;

    @PersistenceContext
    private EntityManager em;

    public StSettleConfigDto.Item getById(String id) {
        StSettleConfigDto.Item dto = stSettleConfigMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public StSettleConfig findById(String id) {
        return stSettleConfigRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return stSettleConfigRepository.existsById(id);
    }

    public List<StSettleConfigDto.Item> getList(StSettleConfigDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return stSettleConfigMapper.selectList(req);
    }

    public StSettleConfigDto.PageResponse getPageData(StSettleConfigDto.Request req) {
        PageHelper.addPaging(req);
        StSettleConfigDto.PageResponse res = new StSettleConfigDto.PageResponse();
        List<StSettleConfigDto.Item> list = stSettleConfigMapper.selectPageList(req);
        long count = stSettleConfigMapper.selectPageCount(req);
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public StSettleConfig create(StSettleConfig body) {
        body.setSettleConfigId(CmUtil.generateId("st_settle_config"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        StSettleConfig saved = stSettleConfigRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(saved.getSettleConfigId());
    }

    @Transactional
    public StSettleConfig save(StSettleConfig entity) {
        if (!existsById(entity.getSettleConfigId()))
            throw new CmBizException("존재하지 않는 StSettleConfig입니다: " + entity.getSettleConfigId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        StSettleConfig saved = stSettleConfigRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(saved.getSettleConfigId());
    }

    @Transactional
    public StSettleConfig update(String id, StSettleConfig body) {
        StSettleConfig entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "settleConfigId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        StSettleConfig saved = stSettleConfigRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(id);
    }

    @Transactional
    public StSettleConfig updatePartial(StSettleConfig entity) {
        if (entity.getSettleConfigId() == null) throw new CmBizException("settleConfigId 가 필요합니다.");
        if (!existsById(entity.getSettleConfigId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getSettleConfigId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = stSettleConfigMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return findById(entity.getSettleConfigId());
    }

    @Transactional
    public void delete(String id) {
        StSettleConfig entity = findById(id);
        stSettleConfigRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public List<StSettleConfig> saveList(List<StSettleConfig> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getSettleConfigId() != null)
            .map(StSettleConfig::getSettleConfigId)
            .toList();
        if (!deleteIds.isEmpty()) {
            stSettleConfigRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }

        List<String> upsertedIds = new ArrayList<>();
        List<StSettleConfig> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getSettleConfigId() != null)
            .toList();
        for (StSettleConfig row : updateRows) {
            StSettleConfig entity = findById(row.getSettleConfigId());
            VoUtil.voCopyExclude(row, entity, "settleConfigId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            stSettleConfigRepository.save(entity);
            upsertedIds.add(entity.getSettleConfigId());
        }
        em.flush();

        List<StSettleConfig> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (StSettleConfig row : insertRows) {
            row.setSettleConfigId(CmUtil.generateId("st_settle_config"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            stSettleConfigRepository.save(row);
            upsertedIds.add(row.getSettleConfigId());
        }
        em.flush();
        em.clear();

        List<StSettleConfig> result = new ArrayList<>();
        for (String id : upsertedIds) {
            result.add(findById(id));
        }
        return result;
    }
}

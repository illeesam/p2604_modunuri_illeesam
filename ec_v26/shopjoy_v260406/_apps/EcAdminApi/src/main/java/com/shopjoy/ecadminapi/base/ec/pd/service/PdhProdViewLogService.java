package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdhProdViewLogDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdhProdViewLog;
import com.shopjoy.ecadminapi.base.ec.pd.mapper.PdhProdViewLogMapper;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdhProdViewLogRepository;
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
public class PdhProdViewLogService {

    private final PdhProdViewLogMapper pdhProdViewLogMapper;
    private final PdhProdViewLogRepository pdhProdViewLogRepository;

    @PersistenceContext
    private EntityManager em;

    public PdhProdViewLogDto.Item getById(String id) {
        PdhProdViewLogDto.Item dto = pdhProdViewLogMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public PdhProdViewLog findById(String id) {
        return pdhProdViewLogRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return pdhProdViewLogRepository.existsById(id);
    }

    public List<PdhProdViewLogDto.Item> getList(PdhProdViewLogDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return pdhProdViewLogMapper.selectList(VoUtil.voToMap(req));
    }

    public PdhProdViewLogDto.PageResponse getPageData(PdhProdViewLogDto.Request req) {
        PageHelper.addPaging(req);
        PdhProdViewLogDto.PageResponse res = new PdhProdViewLogDto.PageResponse();
        List<PdhProdViewLogDto.Item> list = pdhProdViewLogMapper.selectPageList(VoUtil.voToMap(req));
        long count = pdhProdViewLogMapper.selectPageCount(VoUtil.voToMap(req));
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public PdhProdViewLog create(PdhProdViewLog body) {
        body.setLogId(CmUtil.generateId("pdh_prod_view_log"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PdhProdViewLog saved = pdhProdViewLogRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public PdhProdViewLog save(PdhProdViewLog entity) {
        if (!existsById(entity.getLogId()))
            throw new CmBizException("존재하지 않는 PdhProdViewLog입니다: " + entity.getLogId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PdhProdViewLog saved = pdhProdViewLogRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public PdhProdViewLog update(String id, PdhProdViewLog body) {
        PdhProdViewLog entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "logId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PdhProdViewLog saved = pdhProdViewLogRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public PdhProdViewLog updatePartial(PdhProdViewLog entity) {
        if (entity.getLogId() == null) throw new CmBizException("logId 가 필요합니다.");
        if (!existsById(entity.getLogId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getLogId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = pdhProdViewLogMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        PdhProdViewLog entity = findById(id);
        pdhProdViewLogRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public void saveList(List<PdhProdViewLog> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getLogId() != null)
            .map(PdhProdViewLog::getLogId)
            .toList();
        if (!deleteIds.isEmpty()) {
            pdhProdViewLogRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<PdhProdViewLog> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getLogId() != null)
            .toList();
        for (PdhProdViewLog row : updateRows) {
            PdhProdViewLog entity = findById(row.getLogId());
            VoUtil.voCopyExclude(row, entity, "logId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            pdhProdViewLogRepository.save(entity);
        }
        em.flush();

        List<PdhProdViewLog> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (PdhProdViewLog row : insertRows) {
            row.setLogId(CmUtil.generateId("pdh_prod_view_log"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            pdhProdViewLogRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}

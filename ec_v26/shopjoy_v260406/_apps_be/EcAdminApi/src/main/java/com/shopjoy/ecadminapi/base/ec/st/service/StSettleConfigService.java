package com.shopjoy.ecadminapi.base.ec.st.service;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleConfigDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleConfig;
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
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StSettleConfigService {

    private final StSettleConfigRepository stSettleConfigRepository;

    @PersistenceContext
    private EntityManager em;

    public StSettleConfigDto.Item getById(String id) {
        StSettleConfigDto.Item dto = stSettleConfigRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public StSettleConfigDto.Item getByIdOrNull(String id) {
        return stSettleConfigRepository.selectById(id).orElse(null);
    }

    public StSettleConfig findById(String id) {
        return stSettleConfigRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public StSettleConfig findByIdOrNull(String id) {
        return stSettleConfigRepository.findById(id).orElse(null);
    }

    public boolean existsById(String id) {
        return stSettleConfigRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!stSettleConfigRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    public List<StSettleConfigDto.Item> getList(StSettleConfigDto.Request req) {
        return stSettleConfigRepository.selectList(req);
    }

    public StSettleConfigDto.PageResponse getPageData(StSettleConfigDto.Request req) {
        PageHelper.addPaging(req);
        return stSettleConfigRepository.selectPageList(req);
    }

    @Transactional
    public StSettleConfig create(StSettleConfig body) {
        body.setSettleConfigId(CmUtil.generateId("st_settle_config"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        StSettleConfig saved = stSettleConfigRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public StSettleConfig save(StSettleConfig entity) {
        if (!existsById(entity.getSettleConfigId()))
            throw new CmBizException("존재하지 않는 StSettleConfig입니다: " + entity.getSettleConfigId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        StSettleConfig saved = stSettleConfigRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public StSettleConfig update(String id, StSettleConfig body) {
        StSettleConfig entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "settleConfigId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        StSettleConfig saved = stSettleConfigRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public StSettleConfig updateSelective(StSettleConfig entity) {
        if (entity.getSettleConfigId() == null) throw new CmBizException("settleConfigId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getSettleConfigId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getSettleConfigId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = stSettleConfigRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        StSettleConfig entity = findById(id);
        stSettleConfigRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    @Transactional
    public void saveList(List<StSettleConfig> rows) {
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
        List<StSettleConfig> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getSettleConfigId() != null)
            .toList();
        for (StSettleConfig row : updateRows) {
            StSettleConfig entity = findById(row.getSettleConfigId());
            VoUtil.voCopyExclude(row, entity, "settleConfigId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            stSettleConfigRepository.save(entity);
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
        }
        em.flush();
        em.clear();
    }
}

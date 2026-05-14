package com.shopjoy.ecadminapi.base.ec.st.service;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleAdjDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleAdj;
import com.shopjoy.ecadminapi.base.ec.st.repository.StSettleAdjRepository;
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
public class StSettleAdjService {

    private final StSettleAdjRepository stSettleAdjRepository;

    @PersistenceContext
    private EntityManager em;

    public StSettleAdjDto.Item getById(String id) {
        StSettleAdjDto.Item dto = stSettleAdjRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public StSettleAdjDto.Item getByIdOrNull(String id) {
        return stSettleAdjRepository.selectById(id).orElse(null);
    }

    public StSettleAdj findById(String id) {
        return stSettleAdjRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public StSettleAdj findByIdOrNull(String id) {
        return stSettleAdjRepository.findById(id).orElse(null);
    }

    public boolean existsById(String id) {
        return stSettleAdjRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!stSettleAdjRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    public List<StSettleAdjDto.Item> getList(StSettleAdjDto.Request req) {
        return stSettleAdjRepository.selectList(req);
    }

    public StSettleAdjDto.PageResponse getPageData(StSettleAdjDto.Request req) {
        PageHelper.addPaging(req);
        return stSettleAdjRepository.selectPageList(req);
    }

    @Transactional
    public StSettleAdj create(StSettleAdj body) {
        body.setSettleAdjId(CmUtil.generateId("st_settle_adj"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        StSettleAdj saved = stSettleAdjRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public StSettleAdj save(StSettleAdj entity) {
        if (!existsById(entity.getSettleAdjId()))
            throw new CmBizException("존재하지 않는 StSettleAdj입니다: " + entity.getSettleAdjId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        StSettleAdj saved = stSettleAdjRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public StSettleAdj update(String id, StSettleAdj body) {
        StSettleAdj entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "settleAdjId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        StSettleAdj saved = stSettleAdjRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public StSettleAdj updateSelective(StSettleAdj entity) {
        if (entity.getSettleAdjId() == null) throw new CmBizException("settleAdjId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getSettleAdjId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getSettleAdjId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = stSettleAdjRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        StSettleAdj entity = findById(id);
        stSettleAdjRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    @Transactional
    public void saveList(List<StSettleAdj> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getSettleAdjId() != null)
            .map(StSettleAdj::getSettleAdjId)
            .toList();
        if (!deleteIds.isEmpty()) {
            stSettleAdjRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<StSettleAdj> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getSettleAdjId() != null)
            .toList();
        for (StSettleAdj row : updateRows) {
            StSettleAdj entity = findById(row.getSettleAdjId());
            VoUtil.voCopyExclude(row, entity, "settleAdjId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            stSettleAdjRepository.save(entity);
        }
        em.flush();

        List<StSettleAdj> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (StSettleAdj row : insertRows) {
            row.setSettleAdjId(CmUtil.generateId("st_settle_adj"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            stSettleAdjRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}

package com.shopjoy.ecadminapi.base.ec.st.service;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettle;
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
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StSettleService {

    private final StSettleRepository stSettleRepository;

    @PersistenceContext
    private EntityManager em;

    /* 정산 키조회 */
    public StSettleDto.Item getById(String id) {
        StSettleDto.Item dto = stSettleRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public StSettleDto.Item getByIdOrNull(String id) {
        return stSettleRepository.selectById(id).orElse(null);
    }

    /* 정산 상세조회 */
    public StSettle findById(String id) {
        return stSettleRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public StSettle findByIdOrNull(String id) {
        return stSettleRepository.findById(id).orElse(null);
    }

    /* 정산 키검증 */
    public boolean existsById(String id) {
        return stSettleRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!stSettleRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 정산 목록조회 */
    public List<StSettleDto.Item> getList(StSettleDto.Request req) {
        return stSettleRepository.selectList(req);
    }

    /* 정산 페이지조회 */
    public StSettleDto.PageResponse getPageData(StSettleDto.Request req) {
        PageHelper.addPaging(req);
        return stSettleRepository.selectPageList(req);
    }

    /* 정산 등록 */
    @Transactional
    public StSettle create(StSettle body) {
        body.setSettleId(CmUtil.generateId("st_settle"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        StSettle saved = stSettleRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 정산 저장 */
    @Transactional
    public StSettle save(StSettle entity) {
        if (!existsById(entity.getSettleId()))
            throw new CmBizException("존재하지 않는 StSettle입니다: " + entity.getSettleId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        StSettle saved = stSettleRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 정산 수정 */
    @Transactional
    public StSettle update(String id, StSettle body) {
        StSettle entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "settleId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        StSettle saved = stSettleRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 정산 수정 */
    @Transactional
    public StSettle updateSelective(StSettle entity) {
        if (entity.getSettleId() == null) throw new CmBizException("settleId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getSettleId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getSettleId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = stSettleRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 정산 삭제 */
    @Transactional
    public void delete(String id) {
        StSettle entity = findById(id);
        stSettleRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    /* 정산 목록저장 */
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

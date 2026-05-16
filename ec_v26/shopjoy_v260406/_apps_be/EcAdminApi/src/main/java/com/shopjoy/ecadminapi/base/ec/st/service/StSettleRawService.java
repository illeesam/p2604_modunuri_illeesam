package com.shopjoy.ecadminapi.base.ec.st.service;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleRawDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleRaw;
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
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StSettleRawService {

    private final StSettleRawRepository stSettleRawRepository;

    @PersistenceContext
    private EntityManager em;

    /* 정산 원천 데이터 키조회 */
    public StSettleRawDto.Item getById(String id) {
        StSettleRawDto.Item dto = stSettleRawRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public StSettleRawDto.Item getByIdOrNull(String id) {
        return stSettleRawRepository.selectById(id).orElse(null);
    }

    /* 정산 원천 데이터 상세조회 */
    public StSettleRaw findById(String id) {
        return stSettleRawRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public StSettleRaw findByIdOrNull(String id) {
        return stSettleRawRepository.findById(id).orElse(null);
    }

    /* 정산 원천 데이터 키검증 */
    public boolean existsById(String id) {
        return stSettleRawRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!stSettleRawRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 정산 원천 데이터 목록조회 */
    public List<StSettleRawDto.Item> getList(StSettleRawDto.Request req) {
        return stSettleRawRepository.selectList(req);
    }

    /* 정산 원천 데이터 페이지조회 */
    public StSettleRawDto.PageResponse getPageData(StSettleRawDto.Request req) {
        PageHelper.addPaging(req);
        return stSettleRawRepository.selectPageList(req);
    }

    /* 정산 원천 데이터 등록 */
    @Transactional
    public StSettleRaw create(StSettleRaw body) {
        body.setSettleRawId(CmUtil.generateId("st_settle_raw"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        StSettleRaw saved = stSettleRawRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 정산 원천 데이터 저장 */
    @Transactional
    public StSettleRaw save(StSettleRaw entity) {
        if (!existsById(entity.getSettleRawId()))
            throw new CmBizException("존재하지 않는 StSettleRaw입니다: " + entity.getSettleRawId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        StSettleRaw saved = stSettleRawRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 정산 원천 데이터 수정 */
    @Transactional
    public StSettleRaw update(String id, StSettleRaw body) {
        StSettleRaw entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "settleRawId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        StSettleRaw saved = stSettleRawRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 정산 원천 데이터 수정 */
    @Transactional
    public StSettleRaw updateSelective(StSettleRaw entity) {
        if (entity.getSettleRawId() == null) throw new CmBizException("settleRawId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getSettleRawId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getSettleRawId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = stSettleRawRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 정산 원천 데이터 삭제 */
    @Transactional
    public void delete(String id) {
        StSettleRaw entity = findById(id);
        stSettleRawRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    /* 정산 원천 데이터 목록저장 */
    @Transactional
    public void saveList(List<StSettleRaw> rows) {
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
        List<StSettleRaw> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getSettleRawId() != null)
            .toList();
        for (StSettleRaw row : updateRows) {
            StSettleRaw entity = findById(row.getSettleRawId());
            VoUtil.voCopyExclude(row, entity, "settleRawId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            stSettleRawRepository.save(entity);
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
        }
        em.flush();
        em.clear();
    }
}

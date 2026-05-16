package com.shopjoy.ecadminapi.base.ec.st.service;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleCloseDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleClose;
import com.shopjoy.ecadminapi.base.ec.st.repository.StSettleCloseRepository;
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
public class StSettleCloseService {

    private final StSettleCloseRepository stSettleCloseRepository;

    @PersistenceContext
    private EntityManager em;

    /* 정산 마감 키조회 */
    public StSettleCloseDto.Item getById(String id) {
        StSettleCloseDto.Item dto = stSettleCloseRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public StSettleCloseDto.Item getByIdOrNull(String id) {
        return stSettleCloseRepository.selectById(id).orElse(null);
    }

    /* 정산 마감 상세조회 */
    public StSettleClose findById(String id) {
        return stSettleCloseRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public StSettleClose findByIdOrNull(String id) {
        return stSettleCloseRepository.findById(id).orElse(null);
    }

    /* 정산 마감 키검증 */
    public boolean existsById(String id) {
        return stSettleCloseRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!stSettleCloseRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 정산 마감 목록조회 */
    public List<StSettleCloseDto.Item> getList(StSettleCloseDto.Request req) {
        return stSettleCloseRepository.selectList(req);
    }

    /* 정산 마감 페이지조회 */
    public StSettleCloseDto.PageResponse getPageData(StSettleCloseDto.Request req) {
        PageHelper.addPaging(req);
        return stSettleCloseRepository.selectPageList(req);
    }

    /* 정산 마감 등록 */
    @Transactional
    public StSettleClose create(StSettleClose body) {
        body.setSettleCloseId(CmUtil.generateId("st_settle_close"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        StSettleClose saved = stSettleCloseRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 정산 마감 저장 */
    @Transactional
    public StSettleClose save(StSettleClose entity) {
        if (!existsById(entity.getSettleCloseId()))
            throw new CmBizException("존재하지 않는 StSettleClose입니다: " + entity.getSettleCloseId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        StSettleClose saved = stSettleCloseRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 정산 마감 수정 */
    @Transactional
    public StSettleClose update(String id, StSettleClose body) {
        StSettleClose entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "settleCloseId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        StSettleClose saved = stSettleCloseRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 정산 마감 수정 */
    @Transactional
    public StSettleClose updateSelective(StSettleClose entity) {
        if (entity.getSettleCloseId() == null) throw new CmBizException("settleCloseId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getSettleCloseId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getSettleCloseId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = stSettleCloseRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 정산 마감 삭제 */
    @Transactional
    public void delete(String id) {
        StSettleClose entity = findById(id);
        stSettleCloseRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    /* 정산 마감 목록저장 */
    @Transactional
    public void saveList(List<StSettleClose> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getSettleCloseId() != null)
            .map(StSettleClose::getSettleCloseId)
            .toList();
        if (!deleteIds.isEmpty()) {
            stSettleCloseRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<StSettleClose> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getSettleCloseId() != null)
            .toList();
        for (StSettleClose row : updateRows) {
            StSettleClose entity = findById(row.getSettleCloseId());
            VoUtil.voCopyExclude(row, entity, "settleCloseId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            stSettleCloseRepository.save(entity);
        }
        em.flush();

        List<StSettleClose> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (StSettleClose row : insertRows) {
            row.setSettleCloseId(CmUtil.generateId("st_settle_close"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            stSettleCloseRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}

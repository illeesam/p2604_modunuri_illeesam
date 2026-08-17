package com.shopjoy.ecadminapi.base.ec.st.service;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.base.ec.st.data.dto.StDlivFeePolicyDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StDlivFeePolicy;
import com.shopjoy.ecadminapi.base.ec.st.repository.StDlivFeePolicyRepository;
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
public class StDlivFeePolicyService {

    private final StDlivFeePolicyRepository stDlivFeePolicyRepository;

    @PersistenceContext
    private EntityManager em;

    /* 배송수수료정책 키조회 */
    public StDlivFeePolicyDto.Item getById(String id) {
        StDlivFeePolicyDto.Item dto = stDlivFeePolicyRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public StDlivFeePolicyDto.Item getByIdOrNull(String id) {
        return stDlivFeePolicyRepository.selectById(id).orElse(null);
    }

    /* 배송수수료정책 상세조회 */
    public StDlivFeePolicy findById(String id) {
        return stDlivFeePolicyRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /* 배송수수료정책 키검증 */
    public boolean existsById(String id) {
        return stDlivFeePolicyRepository.existsById(id);
    }

    /* 배송수수료정책 목록조회 */
    public List<StDlivFeePolicyDto.Item> getList(StDlivFeePolicyDto.Request req) {
        return stDlivFeePolicyRepository.selectList(req);
    }

    /* 배송수수료정책 페이지조회 */
    public BasePage<StDlivFeePolicyDto.Item> getPageData(StDlivFeePolicyDto.Request req) {
        PageHelper.addPaging(req);
        return stDlivFeePolicyRepository.selectPageData(req);
    }

    /* 배송수수료정책 등록 */
    @Transactional
    public StDlivFeePolicy create(StDlivFeePolicy body) {
        body.setDlivFeePolicyId(CmUtil.generateId("st_dliv_fee_policy"));
        if (body.getSiteId() == null || body.getSiteId().isBlank()) { body.setSiteId(SecurityUtil.getSiteIdOrDefault()); }
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        StDlivFeePolicy saved = stDlivFeePolicyRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 배송수수료정책 수정 */
    @Transactional
    public StDlivFeePolicy update(String id, StDlivFeePolicy body) {
        CmUtil.requireId(id, "id", this);
        StDlivFeePolicy entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "dlivFeePolicyId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        StDlivFeePolicy saved = stDlivFeePolicyRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 배송수수료정책 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        StDlivFeePolicy entity = findById(id);
        stDlivFeePolicyRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public StDlivFeePolicy saveOneBase(StDlivFeePolicy entity) {
        String authId     = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        String rowStatus  = entity.resolveRowStatus(entity.getDlivFeePolicyId());

        if ("D".equals(rowStatus)) {
            if (entity.getDlivFeePolicyId() == null)
                throw new CmBizException("삭제 대상 dlivFeePolicyId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            if (!stDlivFeePolicyRepository.existsById(entity.getDlivFeePolicyId()))
                throw new CmBizException("존재하지 않는 StDlivFeePolicy입니다: " + entity.getDlivFeePolicyId() + "::" + CmUtil.svcCallerInfo(this));
            stDlivFeePolicyRepository.deleteById(entity.getDlivFeePolicyId());
            return null;
        } else if ("I".equals(rowStatus)) {
            entity.setDlivFeePolicyId(CmUtil.generateId("st_dliv_fee_policy"));
            if (entity.getSiteId() == null || entity.getSiteId().isBlank()) { entity.setSiteId(SecurityUtil.getSiteIdOrDefault()); }
            entity.setRegBy(authId); entity.setRegDate(now);
            entity.setUpdBy(authId); entity.setUpdDate(now);
            StDlivFeePolicy saved = stDlivFeePolicyRepository.save(entity);
            if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
            return saved;
        } else if ("U".equals(rowStatus)) {
            if (entity.getDlivFeePolicyId() == null)
                throw new CmBizException("수정 대상 dlivFeePolicyId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            entity.setUpdBy(authId);
            int affected = stDlivFeePolicyRepository.updateSelective(entity);
            if (affected == 0)
                throw new CmBizException("존재하지 않는 StDlivFeePolicy입니다: " + entity.getDlivFeePolicyId() + "::" + CmUtil.svcCallerInfo(this));
            em.clear();
            return findById(entity.getDlivFeePolicyId());
        }
        throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));
    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별). cmd: "base"=기본 흐름. */
    @Transactional
    public void saveListBase(List<StDlivFeePolicy> rows) {
        for (StDlivFeePolicy row : rows) {
            String rs = row.getRowStatus();
            if ("M".equals(rs) || rs == null || rs.isBlank()) {
                row.setRowStatus((row.getDlivFeePolicyId() == null || row.getDlivFeePolicyId().isBlank()) ? "I" : "U");
            } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
            }
        }
        CmUtil.requireRowIds(rows, StDlivFeePolicy::getDlivFeePolicyId, "U", "dlivFeePolicyId", this);
        CmUtil.requireRowIds(rows, StDlivFeePolicy::getDlivFeePolicyId, "D", "dlivFeePolicyId", this);
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()))
            .map(StDlivFeePolicy::getDlivFeePolicyId)
            .toList();
        if (!deleteIds.isEmpty()) {
            stDlivFeePolicyRepository.deleteAllById(deleteIds);
        }

        List<StDlivFeePolicy> updateRows = rows.stream().filter(r -> "U".equals(r.getRowStatus())).toList();
        for (StDlivFeePolicy row : updateRows) {
            row.setUpdBy(authId);
            int affected = stDlivFeePolicyRepository.updateSelective(row);
            if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getDlivFeePolicyId() + "::" + CmUtil.svcCallerInfo(this));
        }

        List<StDlivFeePolicy> insertRows = rows.stream().filter(r -> "I".equals(r.getRowStatus())).toList();
        for (StDlivFeePolicy row : insertRows) {
            row.setDlivFeePolicyId(CmUtil.generateId("st_dliv_fee_policy"));
            if (row.getSiteId() == null || row.getSiteId().isBlank()) { row.setSiteId(SecurityUtil.getSiteIdOrDefault()); }
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            stDlivFeePolicyRepository.save(row);
        }

        em.flush();
        em.clear();
    }
}

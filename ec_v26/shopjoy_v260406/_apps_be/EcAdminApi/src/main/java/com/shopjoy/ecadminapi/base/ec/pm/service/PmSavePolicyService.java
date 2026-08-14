package com.shopjoy.ecadminapi.base.ec.pm.service;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmSavePolicyDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmSavePolicy;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmSavePolicyRepository;
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
public class PmSavePolicyService {

    private final PmSavePolicyRepository pmSavePolicyRepository;

    @PersistenceContext
    private EntityManager em;

    /* 적립금정책 키조회 */
    public PmSavePolicyDto.Item getById(String id) {
        PmSavePolicyDto.Item dto = pmSavePolicyRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    public PmSavePolicyDto.Item getByIdOrNull(String id) {
        return pmSavePolicyRepository.selectById(id).orElse(null);
    }

    public PmSavePolicy findById(String id) {
        return pmSavePolicyRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    public boolean existsById(String id) {
        return pmSavePolicyRepository.existsById(id);
    }

    /* 적립금정책 목록조회 */
    public List<PmSavePolicyDto.Item> getList(PmSavePolicyDto.Request req) {
        return pmSavePolicyRepository.selectList(req);
    }

    /* 적립금정책 페이지조회 */
    public BasePage<PmSavePolicyDto.Item> getPageData(PmSavePolicyDto.Request req) {
        PageHelper.addPaging(req);
        return pmSavePolicyRepository.selectPageData(req);
    }

    /* 적립금정책 등록 */
    @Transactional
    public PmSavePolicy create(PmSavePolicy body) {
        body.setSaveId(CmUtil.generateId("pm_save_policy"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PmSavePolicy saved = pmSavePolicyRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 적립금정책 수정 */
    @Transactional
    public PmSavePolicy update(String id, PmSavePolicy body) {
        CmUtil.requireId(id, "id", this);
        PmSavePolicy entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "saveId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmSavePolicy saved = pmSavePolicyRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 적립금정책 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        PmSavePolicy entity = findById(id);
        pmSavePolicyRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별). cmd: "base"=기본 흐름. */
    @Transactional
    public void saveListBase(List<PmSavePolicy> rows) {
        for (PmSavePolicy row : rows) {
            String rs = row.getRowStatus();
            if ("M".equals(rs) || rs == null || rs.isBlank()) {
                row.setRowStatus((row.getSaveId() == null || row.getSaveId().isBlank()) ? "I" : "U");
            } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
            }
        }
        CmUtil.requireRowIds(rows, PmSavePolicy::getSaveId, "U", "saveId", this);
        CmUtil.requireRowIds(rows, PmSavePolicy::getSaveId, "D", "saveId", this);
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()))
            .map(PmSavePolicy::getSaveId)
            .toList();
        if (!deleteIds.isEmpty()) {
            pmSavePolicyRepository.deleteAllById(deleteIds);
        }

        List<PmSavePolicy> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()))
            .toList();
        for (PmSavePolicy row : updateRows) {
            row.setUpdBy(authId);
            int affected = pmSavePolicyRepository.updateSelective(row);
            if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getSaveId() + "::" + CmUtil.svcCallerInfo(this));
        }

        List<PmSavePolicy> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (PmSavePolicy row : insertRows) {
            row.setSaveId(CmUtil.generateId("pm_save_policy"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            pmSavePolicyRepository.save(row);
        }

        em.flush();
        em.clear();
    }
}

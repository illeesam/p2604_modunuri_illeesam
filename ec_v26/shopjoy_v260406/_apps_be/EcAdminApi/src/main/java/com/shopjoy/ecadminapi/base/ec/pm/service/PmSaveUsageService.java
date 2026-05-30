package com.shopjoy.ecadminapi.base.ec.pm.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmSaveUsageDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmSaveUsage;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmSaveUsageRepository;
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
public class PmSaveUsageService {

    private final PmSaveUsageRepository pmSaveUsageRepository;

    @PersistenceContext
    private EntityManager em;

    /* 적립금 사용 이력 키조회 */
    public PmSaveUsageDto.Item getById(String id) {
        PmSaveUsageDto.Item dto = pmSaveUsageRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PmSaveUsageDto.Item getByIdOrNull(String id) {
        return pmSaveUsageRepository.selectById(id).orElse(null);
    }

    /* 적립금 사용 이력 상세조회 */
    public PmSaveUsage findById(String id) {
        return pmSaveUsageRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PmSaveUsage findByIdOrNull(String id) {
        return pmSaveUsageRepository.findById(id).orElse(null);
    }

    /* 적립금 사용 이력 키검증 */
    public boolean existsById(String id) {
        return pmSaveUsageRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!pmSaveUsageRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 적립금 사용 이력 목록조회 */
    public List<PmSaveUsageDto.Item> getList(PmSaveUsageDto.Request req) {
        return pmSaveUsageRepository.selectList(req);
    }

    /* 적립금 사용 이력 페이지조회 */
    public PmSaveUsageDto.PageResponse getPageData(PmSaveUsageDto.Request req) {
        PageHelper.addPaging(req);
        return pmSaveUsageRepository.selectPageList(req);
    }

    /* 적립금 사용 이력 등록 */
    @Transactional
    public PmSaveUsage create(PmSaveUsage body) {
        body.setSaveUsageId(CmUtil.generateId("pm_save_usage"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PmSaveUsage saved = pmSaveUsageRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 적립금 사용 이력 수정 */
    @Transactional
    public PmSaveUsage update(String id, PmSaveUsage body) {
        CmUtil.requireId(id, "id", this);
        PmSaveUsage entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "saveUsageId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmSaveUsage saved = pmSaveUsageRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 적립금 사용 이력 수정 */
    @Transactional
    public PmSaveUsage updateSelective(PmSaveUsage entity) {
        if (entity.getSaveUsageId() == null) throw new CmBizException("saveUsageId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getSaveUsageId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getSaveUsageId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = pmSaveUsageRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 적립금 사용 이력 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        PmSaveUsage entity = findById(id);
        pmSaveUsageRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public PmSaveUsage save(String cmd, PmSaveUsage entity) {
        if ("base".equals(cmd)) {
            String rowStatus  = entity.getRowStatus();
            String authId     = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
            if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
                rowStatus = (entity.getSaveUsageId() == null || entity.getSaveUsageId().isBlank()) ? "I" : "U";
            }

            if ("D".equals(rowStatus)) {
                if (entity.getSaveUsageId() == null)
                    throw new CmBizException("삭제 대상 saveUsageId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                if (!pmSaveUsageRepository.existsById(entity.getSaveUsageId()))
                    throw new CmBizException("존재하지 않는 PmSaveUsage입니다: " + entity.getSaveUsageId() + "::" + CmUtil.svcCallerInfo(this));
                pmSaveUsageRepository.deleteById(entity.getSaveUsageId());
                return null;
            } else if ("I".equals(rowStatus)) {
                entity.setSaveUsageId(CmUtil.generateId("pm_save_usage"));
                entity.setRegBy(authId); entity.setRegDate(now);
                entity.setUpdBy(authId); entity.setUpdDate(now);
                PmSaveUsage saved = pmSaveUsageRepository.save(entity);
                if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
                return saved;
            } else if ("U".equals(rowStatus)) {
                if (entity.getSaveUsageId() == null)
                    throw new CmBizException("수정 대상 saveUsageId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                entity.setUpdBy(authId);
                int affected = pmSaveUsageRepository.updateSelective(entity);
                if (affected == 0)
                    throw new CmBizException("존재하지 않는 PmSaveUsage입니다: " + entity.getSaveUsageId() + "::" + CmUtil.svcCallerInfo(this));
                em.clear();
                return findById(entity.getSaveUsageId());
            }
            throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));
        }
        throw new CmBizException("알 수 없는 save cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveList(String cmd, List<PmSaveUsage> rows) {
        if ("base".equals(cmd)) {
            /* 0단계: rowStatus 정규화 */
            for (PmSaveUsage row : rows) {
                String rs = row.getRowStatus();
                if ("M".equals(rs) || rs == null || rs.isBlank()) {
                    row.setRowStatus((row.getSaveUsageId() == null || row.getSaveUsageId().isBlank()) ? "I" : "U");
                } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                    throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
                }
            }
            CmUtil.requireRowIds(rows, PmSaveUsage::getSaveUsageId, "U", "saveUsageId", this);
            CmUtil.requireRowIds(rows, PmSaveUsage::getSaveUsageId, "D", "saveUsageId", this);
            String authId = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            // 1단계: DELETE 일괄
            List<String> deleteIds = rows.stream()
                .filter(r -> "D".equals(r.getRowStatus()))
                .map(PmSaveUsage::getSaveUsageId)
                .toList();
            if (!deleteIds.isEmpty()) {
                pmSaveUsageRepository.deleteAllById(deleteIds);
            }

            // 2단계: UPDATE - updateSelective
            List<PmSaveUsage> updateRows = rows.stream()
                .filter(r -> "U".equals(r.getRowStatus()))
                .toList();
            for (PmSaveUsage row : updateRows) {
                row.setUpdBy(authId);
                int affected = pmSaveUsageRepository.updateSelective(row);
                if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getSaveUsageId() + "::" + CmUtil.svcCallerInfo(this));
            }

            // 3단계: INSERT
            List<PmSaveUsage> insertRows = rows.stream()
                .filter(r -> "I".equals(r.getRowStatus()))
                .toList();
            for (PmSaveUsage row : insertRows) {
                row.setSaveUsageId(CmUtil.generateId("pm_save_usage"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                pmSaveUsageRepository.save(row);
            }

            // 4단계: 영속성 컨텍스트 동기화
            em.flush();
            em.clear();
            return;
        }
        throw new CmBizException("알 수 없는 saveList cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }
}

package com.shopjoy.ecadminapi.base.ec.pm.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmEventBenefitDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmEventBenefit;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmEventBenefitRepository;
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
public class PmEventBenefitService {

    private final PmEventBenefitRepository pmEventBenefitRepository;

    @PersistenceContext
    private EntityManager em;

    /* 이벤트 혜택 키조회 */
    public PmEventBenefitDto.Item getById(String id) {
        PmEventBenefitDto.Item dto = pmEventBenefitRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PmEventBenefitDto.Item getByIdOrNull(String id) {
        return pmEventBenefitRepository.selectById(id).orElse(null);
    }

    /* 이벤트 혜택 상세조회 */
    public PmEventBenefit findById(String id) {
        return pmEventBenefitRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PmEventBenefit findByIdOrNull(String id) {
        return pmEventBenefitRepository.findById(id).orElse(null);
    }

    /* 이벤트 혜택 키검증 */
    public boolean existsById(String id) {
        return pmEventBenefitRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!pmEventBenefitRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 이벤트 혜택 목록조회 */
    public List<PmEventBenefitDto.Item> getList(PmEventBenefitDto.Request req) {
        return pmEventBenefitRepository.selectList(req);
    }

    /* 이벤트 혜택 페이지조회 */
    public PmEventBenefitDto.PageResponse getPageData(PmEventBenefitDto.Request req) {
        PageHelper.addPaging(req);
        return pmEventBenefitRepository.selectPageData(req);
    }

    /* 이벤트 혜택 등록 */
    @Transactional
    public PmEventBenefit create(PmEventBenefit body) {
        body.setBenefitId(CmUtil.generateId("pm_event_benefit"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PmEventBenefit saved = pmEventBenefitRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 이벤트 혜택 수정 */
    @Transactional
    public PmEventBenefit update(String id, PmEventBenefit body) {
        CmUtil.requireId(id, "id", this);
        PmEventBenefit entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "benefitId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmEventBenefit saved = pmEventBenefitRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 이벤트 혜택 수정 */
    @Transactional
    public PmEventBenefit updateSelective(PmEventBenefit entity) {
        if (entity.getBenefitId() == null) throw new CmBizException("benefitId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getBenefitId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getBenefitId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = pmEventBenefitRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 이벤트 혜택 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        PmEventBenefit entity = findById(id);
        pmEventBenefitRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public PmEventBenefit save(String cmd, PmEventBenefit entity) {
        if ("base".equals(cmd)) {
            String rowStatus  = entity.getRowStatus();
            String authId     = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
            if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
                rowStatus = (entity.getBenefitId() == null || entity.getBenefitId().isBlank()) ? "I" : "U";
            }

            if ("D".equals(rowStatus)) {
                if (entity.getBenefitId() == null)
                    throw new CmBizException("삭제 대상 benefitId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                if (!pmEventBenefitRepository.existsById(entity.getBenefitId()))
                    throw new CmBizException("존재하지 않는 PmEventBenefit입니다: " + entity.getBenefitId() + "::" + CmUtil.svcCallerInfo(this));
                pmEventBenefitRepository.deleteById(entity.getBenefitId());
                return null;
            } else if ("I".equals(rowStatus)) {
                entity.setBenefitId(CmUtil.generateId("pm_event_benefit"));
                entity.setRegBy(authId); entity.setRegDate(now);
                entity.setUpdBy(authId); entity.setUpdDate(now);
                PmEventBenefit saved = pmEventBenefitRepository.save(entity);
                if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
                return saved;
            } else if ("U".equals(rowStatus)) {
                if (entity.getBenefitId() == null)
                    throw new CmBizException("수정 대상 benefitId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                entity.setUpdBy(authId);
                int affected = pmEventBenefitRepository.updateSelective(entity);
                if (affected == 0)
                    throw new CmBizException("존재하지 않는 PmEventBenefit입니다: " + entity.getBenefitId() + "::" + CmUtil.svcCallerInfo(this));
                em.clear();
                return findById(entity.getBenefitId());
            }
            throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));
        }
        throw new CmBizException("알 수 없는 save cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveList(String cmd, List<PmEventBenefit> rows) {
        if ("base".equals(cmd)) {
            /* 0단계: rowStatus 정규화 */
            for (PmEventBenefit row : rows) {
                String rs = row.getRowStatus();
                if ("M".equals(rs) || rs == null || rs.isBlank()) {
                    row.setRowStatus((row.getBenefitId() == null || row.getBenefitId().isBlank()) ? "I" : "U");
                } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                    throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
                }
            }
            CmUtil.requireRowIds(rows, PmEventBenefit::getBenefitId, "U", "benefitId", this);
            CmUtil.requireRowIds(rows, PmEventBenefit::getBenefitId, "D", "benefitId", this);
            String authId = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            // 1단계: DELETE 일괄
            List<String> deleteIds = rows.stream()
                .filter(r -> "D".equals(r.getRowStatus()))
                .map(PmEventBenefit::getBenefitId)
                .toList();
            if (!deleteIds.isEmpty()) {
                pmEventBenefitRepository.deleteAllById(deleteIds);
            }

            // 2단계: UPDATE - updateSelective
            List<PmEventBenefit> updateRows = rows.stream()
                .filter(r -> "U".equals(r.getRowStatus()))
                .toList();
            for (PmEventBenefit row : updateRows) {
                row.setUpdBy(authId);
                int affected = pmEventBenefitRepository.updateSelective(row);
                if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getBenefitId() + "::" + CmUtil.svcCallerInfo(this));
            }

            // 3단계: INSERT
            List<PmEventBenefit> insertRows = rows.stream()
                .filter(r -> "I".equals(r.getRowStatus()))
                .toList();
            for (PmEventBenefit row : insertRows) {
                row.setBenefitId(CmUtil.generateId("pm_event_benefit"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                pmEventBenefitRepository.save(row);
            }

            // 4단계: 영속성 컨텍스트 동기화
            em.flush();
            em.clear();
            return;
        }
        throw new CmBizException("알 수 없는 saveList cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }
}

package com.shopjoy.ecadminapi.base.ec.pm.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmCouponUsageDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmCouponUsage;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmCouponUsageRepository;
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
public class PmCouponUsageService {

    private final PmCouponUsageRepository pmCouponUsageRepository;

    @PersistenceContext
    private EntityManager em;

    /* 쿠폰 사용 이력 키조회 */
    public PmCouponUsageDto.Item getById(String id) {
        PmCouponUsageDto.Item dto = pmCouponUsageRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PmCouponUsageDto.Item getByIdOrNull(String id) {
        return pmCouponUsageRepository.selectById(id).orElse(null);
    }

    /* 쿠폰 사용 이력 상세조회 */
    public PmCouponUsage findById(String id) {
        return pmCouponUsageRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PmCouponUsage findByIdOrNull(String id) {
        return pmCouponUsageRepository.findById(id).orElse(null);
    }

    /* 쿠폰 사용 이력 키검증 */
    public boolean existsById(String id) {
        return pmCouponUsageRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!pmCouponUsageRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 쿠폰 사용 이력 목록조회 */
    public List<PmCouponUsageDto.Item> getList(PmCouponUsageDto.Request req) {
        return pmCouponUsageRepository.selectList(req);
    }

    /* 쿠폰 사용 이력 페이지조회 */
    public PmCouponUsageDto.PageResponse getPageData(PmCouponUsageDto.Request req) {
        PageHelper.addPaging(req);
        return pmCouponUsageRepository.selectPageList(req);
    }

    /* 쿠폰 사용 이력 등록 */
    @Transactional
    public PmCouponUsage create(PmCouponUsage body) {
        body.setUsageId(CmUtil.generateId("pm_coupon_usage"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PmCouponUsage saved = pmCouponUsageRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 쿠폰 사용 이력 수정 */
    @Transactional
    public PmCouponUsage update(String id, PmCouponUsage body) {
        CmUtil.requireId(id, "id", this);
        PmCouponUsage entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "usageId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmCouponUsage saved = pmCouponUsageRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 쿠폰 사용 이력 수정 */
    @Transactional
    public PmCouponUsage updateSelective(PmCouponUsage entity) {
        if (entity.getUsageId() == null) throw new CmBizException("usageId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getUsageId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getUsageId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = pmCouponUsageRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 쿠폰 사용 이력 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        PmCouponUsage entity = findById(id);
        pmCouponUsageRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public PmCouponUsage save(String cmd, PmCouponUsage entity) {
        if ("base".equals(cmd)) {
            String rowStatus  = entity.getRowStatus();
            String authId     = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
            if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
                rowStatus = (entity.getUsageId() == null || entity.getUsageId().isBlank()) ? "I" : "U";
            }

            if ("D".equals(rowStatus)) {
                if (entity.getUsageId() == null)
                    throw new CmBizException("삭제 대상 usageId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                if (!pmCouponUsageRepository.existsById(entity.getUsageId()))
                    throw new CmBizException("존재하지 않는 PmCouponUsage입니다: " + entity.getUsageId() + "::" + CmUtil.svcCallerInfo(this));
                pmCouponUsageRepository.deleteById(entity.getUsageId());
                return null;
            } else if ("I".equals(rowStatus)) {
                entity.setUsageId(CmUtil.generateId("pm_coupon_usage"));
                entity.setRegBy(authId); entity.setRegDate(now);
                entity.setUpdBy(authId); entity.setUpdDate(now);
                PmCouponUsage saved = pmCouponUsageRepository.save(entity);
                if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
                return saved;
            } else if ("U".equals(rowStatus)) {
                if (entity.getUsageId() == null)
                    throw new CmBizException("수정 대상 usageId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                entity.setUpdBy(authId);
                int affected = pmCouponUsageRepository.updateSelective(entity);
                if (affected == 0)
                    throw new CmBizException("존재하지 않는 PmCouponUsage입니다: " + entity.getUsageId() + "::" + CmUtil.svcCallerInfo(this));
                em.clear();
                return findById(entity.getUsageId());
            }
            throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));
        }
        throw new CmBizException("알 수 없는 save cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveList(String cmd, List<PmCouponUsage> rows) {
        if ("base".equals(cmd)) {
            /* 0단계: rowStatus 정규화 */
            for (PmCouponUsage row : rows) {
                String rs = row.getRowStatus();
                if ("M".equals(rs) || rs == null || rs.isBlank()) {
                    row.setRowStatus((row.getUsageId() == null || row.getUsageId().isBlank()) ? "I" : "U");
                } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                    throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
                }
            }
            CmUtil.requireRowIds(rows, PmCouponUsage::getUsageId, "U", "usageId", this);
            CmUtil.requireRowIds(rows, PmCouponUsage::getUsageId, "D", "usageId", this);
            String authId = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            // 1단계: DELETE 일괄
            List<String> deleteIds = rows.stream()
                .filter(r -> "D".equals(r.getRowStatus()))
                .map(PmCouponUsage::getUsageId)
                .toList();
            if (!deleteIds.isEmpty()) {
                pmCouponUsageRepository.deleteAllById(deleteIds);
            }

            // 2단계: UPDATE - updateSelective
            List<PmCouponUsage> updateRows = rows.stream()
                .filter(r -> "U".equals(r.getRowStatus()))
                .toList();
            for (PmCouponUsage row : updateRows) {
                row.setUpdBy(authId);
                int affected = pmCouponUsageRepository.updateSelective(row);
                if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getUsageId() + "::" + CmUtil.svcCallerInfo(this));
            }

            // 3단계: INSERT
            List<PmCouponUsage> insertRows = rows.stream()
                .filter(r -> "I".equals(r.getRowStatus()))
                .toList();
            for (PmCouponUsage row : insertRows) {
                row.setUsageId(CmUtil.generateId("pm_coupon_usage"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                pmCouponUsageRepository.save(row);
            }

            // 4단계: 영속성 컨텍스트 동기화
            em.flush();
            em.clear();
            return;
        }
        throw new CmBizException("알 수 없는 saveList cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }
}

package com.shopjoy.ecadminapi.base.ec.pm.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmCouponItemDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmCouponItem;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmCouponItemRepository;
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
public class PmCouponItemService {

    private final PmCouponItemRepository pmCouponItemRepository;

    @PersistenceContext
    private EntityManager em;

    /* 쿠폰 대상 상품 키조회 */
    public PmCouponItemDto.Item getById(String id) {
        PmCouponItemDto.Item dto = pmCouponItemRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PmCouponItemDto.Item getByIdOrNull(String id) {
        return pmCouponItemRepository.selectById(id).orElse(null);
    }

    /* 쿠폰 대상 상품 상세조회 */
    public PmCouponItem findById(String id) {
        return pmCouponItemRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PmCouponItem findByIdOrNull(String id) {
        return pmCouponItemRepository.findById(id).orElse(null);
    }

    /* 쿠폰 대상 상품 키검증 */
    public boolean existsById(String id) {
        return pmCouponItemRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!pmCouponItemRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 쿠폰 대상 상품 목록조회 */
    public List<PmCouponItemDto.Item> getList(PmCouponItemDto.Request req) {
        return pmCouponItemRepository.selectList(req);
    }

    /* 쿠폰 대상 상품 페이지조회 */
    public PmCouponItemDto.PageResponse getPageData(PmCouponItemDto.Request req) {
        PageHelper.addPaging(req);
        return pmCouponItemRepository.selectPageData(req);
    }

    /* 쿠폰 대상 상품 등록 */
    @Transactional
    public PmCouponItem create(PmCouponItem body) {
        body.setCouponItemId(CmUtil.generateId("pm_coupon_item"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PmCouponItem saved = pmCouponItemRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 쿠폰 대상 상품 수정 */
    @Transactional
    public PmCouponItem update(String id, PmCouponItem body) {
        CmUtil.requireId(id, "id", this);
        PmCouponItem entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "couponItemId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmCouponItem saved = pmCouponItemRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 쿠폰 대상 상품 수정 */
    @Transactional
    public PmCouponItem updateSelective(PmCouponItem entity) {
        if (entity.getCouponItemId() == null) throw new CmBizException("couponItemId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getCouponItemId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getCouponItemId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = pmCouponItemRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 쿠폰 대상 상품 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        PmCouponItem entity = findById(id);
        pmCouponItemRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public PmCouponItem save(String cmd, PmCouponItem entity) {
        if ("base".equals(cmd)) {
            String rowStatus  = entity.getRowStatus();
            String authId     = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
            if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
                rowStatus = (entity.getCouponItemId() == null || entity.getCouponItemId().isBlank()) ? "I" : "U";
            }

            if ("D".equals(rowStatus)) {
                if (entity.getCouponItemId() == null)
                    throw new CmBizException("삭제 대상 couponItemId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                if (!pmCouponItemRepository.existsById(entity.getCouponItemId()))
                    throw new CmBizException("존재하지 않는 PmCouponItem입니다: " + entity.getCouponItemId() + "::" + CmUtil.svcCallerInfo(this));
                pmCouponItemRepository.deleteById(entity.getCouponItemId());
                return null;
            } else if ("I".equals(rowStatus)) {
                entity.setCouponItemId(CmUtil.generateId("pm_coupon_item"));
                entity.setRegBy(authId); entity.setRegDate(now);
                entity.setUpdBy(authId); entity.setUpdDate(now);
                PmCouponItem saved = pmCouponItemRepository.save(entity);
                if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
                return saved;
            } else if ("U".equals(rowStatus)) {
                if (entity.getCouponItemId() == null)
                    throw new CmBizException("수정 대상 couponItemId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                entity.setUpdBy(authId);
                int affected = pmCouponItemRepository.updateSelective(entity);
                if (affected == 0)
                    throw new CmBizException("존재하지 않는 PmCouponItem입니다: " + entity.getCouponItemId() + "::" + CmUtil.svcCallerInfo(this));
                em.clear();
                return findById(entity.getCouponItemId());
            }
            throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));
        }
        throw new CmBizException("알 수 없는 save cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveList(String cmd, List<PmCouponItem> rows) {
        if ("base".equals(cmd)) {
            /* 0단계: rowStatus 정규화 */
            for (PmCouponItem row : rows) {
                String rs = row.getRowStatus();
                if ("M".equals(rs) || rs == null || rs.isBlank()) {
                    row.setRowStatus((row.getCouponItemId() == null || row.getCouponItemId().isBlank()) ? "I" : "U");
                } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                    throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
                }
            }
            CmUtil.requireRowIds(rows, PmCouponItem::getCouponItemId, "U", "couponItemId", this);
            CmUtil.requireRowIds(rows, PmCouponItem::getCouponItemId, "D", "couponItemId", this);
            String authId = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            // 1단계: DELETE 일괄
            List<String> deleteIds = rows.stream()
                .filter(r -> "D".equals(r.getRowStatus()))
                .map(PmCouponItem::getCouponItemId)
                .toList();
            if (!deleteIds.isEmpty()) {
                pmCouponItemRepository.deleteAllById(deleteIds);
            }

            // 2단계: UPDATE - updateSelective
            List<PmCouponItem> updateRows = rows.stream()
                .filter(r -> "U".equals(r.getRowStatus()))
                .toList();
            for (PmCouponItem row : updateRows) {
                row.setUpdBy(authId);
                int affected = pmCouponItemRepository.updateSelective(row);
                if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getCouponItemId() + "::" + CmUtil.svcCallerInfo(this));
            }

            // 3단계: INSERT
            List<PmCouponItem> insertRows = rows.stream()
                .filter(r -> "I".equals(r.getRowStatus()))
                .toList();
            for (PmCouponItem row : insertRows) {
                row.setCouponItemId(CmUtil.generateId("pm_coupon_item"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                pmCouponItemRepository.save(row);
            }

            // 4단계: 영속성 컨텍스트 동기화
            em.flush();
            em.clear();
            return;
        }
        throw new CmBizException("알 수 없는 saveList cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }
}

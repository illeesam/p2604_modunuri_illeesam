package com.shopjoy.ecadminapi.base.ec.pm.service;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmGiftDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmGift;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmGiftRepository;
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
public class PmGiftService {

    private final PmGiftRepository pmGiftRepository;

    @PersistenceContext
    private EntityManager em;

    /* 사은품 키조회 */
    public PmGiftDto.Item getById(String id) {
        // [QueryDSL] 사은품 단건 조회
        PmGiftDto.Item dto = pmGiftRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PmGiftDto.Item getByIdOrNull(String id) {
        // [QueryDSL] 사은품 단건 조회
        return pmGiftRepository.selectById(id).orElse(null);
    }

    /* 사은품 상세조회 */
    public PmGift findById(String id) {
        // [쿼리 메서드] 사은품 단건 조회
        return pmGiftRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PmGift findByIdOrNull(String id) {
        // [쿼리 메서드] 사은품 단건 조회
        return pmGiftRepository.findById(id).orElse(null);
    }

    /* 사은품 키검증 */
    public boolean existsById(String id) {
        // [쿼리 메서드] 사은품 존재 여부 확인
        return pmGiftRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        // [쿼리 메서드] 사은품 존재 여부 확인
        if (!pmGiftRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 사은품 목록조회 */
    public List<PmGiftDto.Item> getList(PmGiftDto.Request req) {
        // [QueryDSL] 사은품 목록 조회
        return pmGiftRepository.selectList(req);
    }

    /* 사은품 페이지조회 */
    public BasePage<PmGiftDto.Item> getPageData(PmGiftDto.Request req) {
        PageHelper.addPaging(req);
        // [QueryDSL] 사은품 페이지 조회
        return pmGiftRepository.selectPageData(req);
    }

    /* 사은품 등록 */
    @Transactional
    public PmGift create(PmGift body) {
        body.setGiftId(CmUtil.generateId("pm_gift"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        // [쿼리 메서드] 사은품 저장
        PmGift saved = pmGiftRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 사은품 수정 */
    @Transactional
    public PmGift update(String id, PmGift body) {
        CmUtil.requireId(id, "id", this);
        PmGift entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "giftId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // [쿼리 메서드] 사은품 저장
        PmGift saved = pmGiftRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 사은품 수정 */
    @Transactional
    public PmGift updateSelective(PmGift entity) {
        if (entity.getGiftId() == null) throw new CmBizException("giftId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getGiftId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getGiftId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // [QueryDSL] 사은품 선택적 필드 수정
        int affected = pmGiftRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();   // clear() 전 필수 — 보류 중인 INSERT/UPDATE 가 clear 로 폐기되는 것 방지
        em.clear();
        return entity;
    }

    /* 사은품 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        PmGift entity = findById(id);
        // [쿼리 메서드] 사은품 삭제
        pmGiftRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public PmGift saveOneBase(PmGift entity) {
        String rowStatus  = entity.getRowStatus();
        String authId     = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
        rowStatus = entity.resolveRowStatus(entity.getGiftId());

        if ("D".equals(rowStatus)) {
            if (entity.getGiftId() == null)
                throw new CmBizException("삭제 대상 giftId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            // [쿼리 메서드] 사은품 존재 여부 확인
            if (!pmGiftRepository.existsById(entity.getGiftId()))
                throw new CmBizException("존재하지 않는 PmGift입니다: " + entity.getGiftId() + "::" + CmUtil.svcCallerInfo(this));
            // [쿼리 메서드] 사은품 ID 기준 삭제
            pmGiftRepository.deleteById(entity.getGiftId());
            return null;
        } else if ("I".equals(rowStatus)) {
            entity.setGiftId(CmUtil.generateId("pm_gift"));
            entity.setRegBy(authId); entity.setRegDate(now);
            entity.setUpdBy(authId); entity.setUpdDate(now);
            // [쿼리 메서드] 사은품 저장
            PmGift saved = pmGiftRepository.save(entity);
            if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
            return saved;
        } else if ("U".equals(rowStatus)) {
            if (entity.getGiftId() == null)
                throw new CmBizException("수정 대상 giftId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            entity.setUpdBy(authId);
            // [QueryDSL] 사은품 선택적 필드 수정
            int affected = pmGiftRepository.updateSelective(entity);
            if (affected == 0)
                throw new CmBizException("존재하지 않는 PmGift입니다: " + entity.getGiftId() + "::" + CmUtil.svcCallerInfo(this));
            em.flush();   // clear() 전 필수 — 보류 중인 INSERT/UPDATE 가 clear 로 폐기되는 것 방지
            em.clear();
            return findById(entity.getGiftId());
        }
        throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));

    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveListBase(List<PmGift> rows) {
        /* 0단계: rowStatus 정규화 */
        for (PmGift row : rows) {
            String rs = row.getRowStatus();
            if ("M".equals(rs) || rs == null || rs.isBlank()) {
                row.setRowStatus((row.getGiftId() == null || row.getGiftId().isBlank()) ? "I" : "U");
            } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
            }
        }
        CmUtil.requireRowIds(rows, PmGift::getGiftId, "U", "giftId", this);
        CmUtil.requireRowIds(rows, PmGift::getGiftId, "D", "giftId", this);
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()))
            .map(PmGift::getGiftId)
            .toList();
        if (!deleteIds.isEmpty()) {
            // [쿼리 메서드] 사은품 조건별 삭제
            pmGiftRepository.deleteAllById(deleteIds);
        }

        // 2단계: UPDATE - updateSelective
        List<PmGift> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()))
            .toList();
        for (PmGift row : updateRows) {
            row.setUpdBy(authId);
            // [QueryDSL] 사은품 선택적 필드 수정
            int affected = pmGiftRepository.updateSelective(row);
            if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getGiftId() + "::" + CmUtil.svcCallerInfo(this));
        }

        // 3단계: INSERT
        List<PmGift> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (PmGift row : insertRows) {
            row.setGiftId(CmUtil.generateId("pm_gift"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            // [쿼리 메서드] 사은품 저장
            pmGiftRepository.save(row);
        }

        // 4단계: 영속성 컨텍스트 동기화
        em.flush();
        em.clear();
        return;

    }
}

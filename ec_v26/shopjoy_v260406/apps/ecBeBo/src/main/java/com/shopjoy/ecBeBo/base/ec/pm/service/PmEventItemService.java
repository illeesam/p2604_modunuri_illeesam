package com.shopjoy.ecBeBo.base.ec.pm.service;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.ec.pm.data.dto.PmEventItemDto;
import com.shopjoy.ecBeBo.base.ec.pm.data.entity.PmEventItem;
import com.shopjoy.ecBeBo.base.ec.pm.repository.PmEventItemRepository;
import com.shopjoy.ecBeBo.common.exception.CmBizException;
import com.shopjoy.ecBeBo.common.util.CmUtil;
import com.shopjoy.ecBeBo.common.util.PageHelper;
import com.shopjoy.ecBeBo.common.util.SecurityUtil;
import com.shopjoy.ecBeBo.common.util.VoUtil;
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
public class PmEventItemService {

    private final PmEventItemRepository pmEventItemRepository;

    @PersistenceContext
    private EntityManager em;

    /* 이벤트 대상 상품 키조회 */
    public PmEventItemDto.Item getById(String id) {
        // [QueryDSL] 이벤트 적용 대상 항목 (상품/카테고리/판매자/브랜드) 단건 조회
        PmEventItemDto.Item dto = pmEventItemRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PmEventItemDto.Item getByIdOrNull(String id) {
        // [QueryDSL] 이벤트 적용 대상 항목 (상품/카테고리/판매자/브랜드) 단건 조회
        return pmEventItemRepository.selectById(id).orElse(null);
    }

    /* 이벤트 대상 상품 상세조회 */
    public PmEventItem findById(String id) {
        // [쿼리 메서드] 이벤트 적용 대상 항목 (상품/카테고리/판매자/브랜드) 단건 조회
        return pmEventItemRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PmEventItem findByIdOrNull(String id) {
        // [쿼리 메서드] 이벤트 적용 대상 항목 (상품/카테고리/판매자/브랜드) 단건 조회
        return pmEventItemRepository.findById(id).orElse(null);
    }

    /* 이벤트 대상 상품 키검증 */
    public boolean existsById(String id) {
        // [쿼리 메서드] 이벤트 적용 대상 항목 (상품/카테고리/판매자/브랜드) 존재 여부 확인
        return pmEventItemRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        // [쿼리 메서드] 이벤트 적용 대상 항목 (상품/카테고리/판매자/브랜드) 존재 여부 확인
        if (!pmEventItemRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 이벤트 대상 상품 목록조회 */
    public List<PmEventItemDto.Item> getList(PmEventItemDto.Request req) {
        // [QueryDSL] 이벤트 적용 대상 항목 (상품/카테고리/판매자/브랜드) 목록 조회
        return pmEventItemRepository.selectList(req);
    }

    /* 이벤트 대상 상품 페이지조회 */
    public BasePage<PmEventItemDto.Item> getPageData(PmEventItemDto.Request req) {
        PageHelper.addPaging(req);
        // [QueryDSL] 이벤트 적용 대상 항목 (상품/카테고리/판매자/브랜드) 페이지 조회
        return pmEventItemRepository.selectPageData(req);
    }

    /* 이벤트 대상 상품 등록 */
    @Transactional
    public PmEventItem create(PmEventItem body) {
        body.setEventItemId(CmUtil.generateId("pm_event_item"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        // [쿼리 메서드] 이벤트 적용 대상 항목 (상품/카테고리/판매자/브랜드) 저장
        PmEventItem saved = pmEventItemRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 이벤트 대상 상품 수정 */
    @Transactional
    public PmEventItem update(String id, PmEventItem body) {
        CmUtil.requireId(id, "id", this);
        PmEventItem entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "eventItemId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // [쿼리 메서드] 이벤트 적용 대상 항목 (상품/카테고리/판매자/브랜드) 저장
        PmEventItem saved = pmEventItemRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 이벤트 대상 상품 수정 */
    @Transactional
    public PmEventItem updateSelective(PmEventItem entity) {
        if (entity.getEventItemId() == null) throw new CmBizException("eventItemId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getEventItemId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getEventItemId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // [QueryDSL] 이벤트 적용 대상 항목 (상품/카테고리/판매자/브랜드) 선택적 필드 수정
        int affected = pmEventItemRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();   // clear() 전 필수 — 보류 중인 INSERT/UPDATE 가 clear 로 폐기되는 것 방지
        em.clear();
        return entity;
    }

    /* 이벤트 대상 상품 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        PmEventItem entity = findById(id);
        // [쿼리 메서드] 이벤트 적용 대상 항목 (상품/카테고리/판매자/브랜드) 삭제
        pmEventItemRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public PmEventItem saveOneBase(PmEventItem entity) {
        String rowStatus  = entity.getRowStatus();
        String authId     = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
        rowStatus = entity.resolveRowStatus(entity.getEventItemId());

        if ("D".equals(rowStatus)) {
            if (entity.getEventItemId() == null)
                throw new CmBizException("삭제 대상 eventItemId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            // [쿼리 메서드] 이벤트 적용 대상 항목 (상품/카테고리/판매자/브랜드) 존재 여부 확인
            if (!pmEventItemRepository.existsById(entity.getEventItemId()))
                throw new CmBizException("존재하지 않는 PmEventItem입니다: " + entity.getEventItemId() + "::" + CmUtil.svcCallerInfo(this));
            // [쿼리 메서드] 이벤트 적용 대상 항목 (상품/카테고리/판매자/브랜드) ID 기준 삭제
            pmEventItemRepository.deleteById(entity.getEventItemId());
            return null;
        } else if ("I".equals(rowStatus)) {
            entity.setEventItemId(CmUtil.generateId("pm_event_item"));
            entity.setRegBy(authId); entity.setRegDate(now);
            entity.setUpdBy(authId); entity.setUpdDate(now);
            // [쿼리 메서드] 이벤트 적용 대상 항목 (상품/카테고리/판매자/브랜드) 저장
            PmEventItem saved = pmEventItemRepository.save(entity);
            if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
            return saved;
        } else if ("U".equals(rowStatus)) {
            if (entity.getEventItemId() == null)
                throw new CmBizException("수정 대상 eventItemId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            entity.setUpdBy(authId);
            // [QueryDSL] 이벤트 적용 대상 항목 (상품/카테고리/판매자/브랜드) 선택적 필드 수정
            int affected = pmEventItemRepository.updateSelective(entity);
            if (affected == 0)
                throw new CmBizException("존재하지 않는 PmEventItem입니다: " + entity.getEventItemId() + "::" + CmUtil.svcCallerInfo(this));
            em.flush();   // clear() 전 필수 — 보류 중인 INSERT/UPDATE 가 clear 로 폐기되는 것 방지
            em.clear();
            return findById(entity.getEventItemId());
        }
        throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));

    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveListBase(List<PmEventItem> rows) {
        /* 0단계: rowStatus 정규화 */
        for (PmEventItem row : rows) {
            String rs = row.getRowStatus();
            if ("M".equals(rs) || rs == null || rs.isBlank()) {
                row.setRowStatus((row.getEventItemId() == null || row.getEventItemId().isBlank()) ? "I" : "U");
            } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
            }
        }
        CmUtil.requireRowIds(rows, PmEventItem::getEventItemId, "U", "eventItemId", this);
        CmUtil.requireRowIds(rows, PmEventItem::getEventItemId, "D", "eventItemId", this);
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()))
            .map(PmEventItem::getEventItemId)
            .toList();
        if (!deleteIds.isEmpty()) {
            // [쿼리 메서드] 이벤트 적용 대상 항목 (상품/카테고리/판매자/브랜드) 조건별 삭제
            pmEventItemRepository.deleteAllById(deleteIds);
        }

        // 2단계: UPDATE - updateSelective
        List<PmEventItem> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()))
            .toList();
        for (PmEventItem row : updateRows) {
            row.setUpdBy(authId);
            // [QueryDSL] 이벤트 적용 대상 항목 (상품/카테고리/판매자/브랜드) 선택적 필드 수정
            int affected = pmEventItemRepository.updateSelective(row);
            if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getEventItemId() + "::" + CmUtil.svcCallerInfo(this));
        }

        // 3단계: INSERT
        List<PmEventItem> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (PmEventItem row : insertRows) {
            row.setEventItemId(CmUtil.generateId("pm_event_item"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            // [쿼리 메서드] 이벤트 적용 대상 항목 (상품/카테고리/판매자/브랜드) 저장
            pmEventItemRepository.save(row);
        }

        // 4단계: 영속성 컨텍스트 동기화
        em.flush();
        em.clear();
        return;

    }
}

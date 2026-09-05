package com.shopjoy.ecBeBo.base.ec.od.service;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.ec.od.data.dto.OdClaimItemDto;
import com.shopjoy.ecBeBo.base.ec.od.data.entity.OdClaimItem;
import com.shopjoy.ecBeBo.base.ec.od.repository.OdClaimItemRepository;
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
public class OdClaimItemService {

    private final OdClaimItemRepository odClaimItemRepository;

    @PersistenceContext
    private EntityManager em;

    /* 클레임 아이템 키조회 */
    public OdClaimItemDto.Item getById(String id) {
        // [QueryDSL] 클레임 항목 (클레임 대상 주문상품 명세) 단건 조회
        OdClaimItemDto.Item dto = odClaimItemRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public OdClaimItemDto.Item getByIdOrNull(String id) {
        // [QueryDSL] 클레임 항목 (클레임 대상 주문상품 명세) 단건 조회
        return odClaimItemRepository.selectById(id).orElse(null);
    }

    /* 클레임 아이템 상세조회 */
    public OdClaimItem findById(String id) {
        // [쿼리 메서드] 클레임 항목 (클레임 대상 주문상품 명세) 단건 조회
        return odClaimItemRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public OdClaimItem findByIdOrNull(String id) {
        // [쿼리 메서드] 클레임 항목 (클레임 대상 주문상품 명세) 단건 조회
        return odClaimItemRepository.findById(id).orElse(null);
    }

    /* 클레임 아이템 키검증 */
    public boolean existsById(String id) {
        // [쿼리 메서드] 클레임 항목 (클레임 대상 주문상품 명세) 존재 여부 확인
        return odClaimItemRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        // [쿼리 메서드] 클레임 항목 (클레임 대상 주문상품 명세) 존재 여부 확인
        if (!odClaimItemRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 클레임 아이템 목록조회 */
    public List<OdClaimItemDto.Item> getList(OdClaimItemDto.Request req) {
        // [QueryDSL] 클레임 항목 (클레임 대상 주문상품 명세) 목록 조회
        return odClaimItemRepository.selectList(req);
    }

    /* 클레임 아이템 페이지조회 */
    public BasePage<OdClaimItemDto.Item> getPageData(OdClaimItemDto.Request req) {
        PageHelper.addPaging(req);
        // [QueryDSL] 클레임 항목 (클레임 대상 주문상품 명세) 페이지 조회
        return odClaimItemRepository.selectPageData(req);
    }

    /* 클레임 아이템 등록 */
    @Transactional
    public OdClaimItem create(OdClaimItem body) {
        body.setClaimItemId(CmUtil.generateId("od_claim_item"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        // [쿼리 메서드] 클레임 항목 (클레임 대상 주문상품 명세) 저장
        OdClaimItem saved = odClaimItemRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 클레임 아이템 수정 */
    @Transactional
    public OdClaimItem update(String id, OdClaimItem body) {
        CmUtil.requireId(id, "id", this);
        OdClaimItem entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "claimItemId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // [쿼리 메서드] 클레임 항목 (클레임 대상 주문상품 명세) 저장
        OdClaimItem saved = odClaimItemRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 클레임 아이템 수정 */
    @Transactional
    public OdClaimItem updateSelective(OdClaimItem entity) {
        if (entity.getClaimItemId() == null) throw new CmBizException("claimItemId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getClaimItemId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getClaimItemId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // [QueryDSL] 클레임 항목 (클레임 대상 주문상품 명세) 선택적 필드 수정
        int affected = odClaimItemRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();   // clear() 전 필수 — 보류 중인 INSERT/UPDATE 가 clear 로 폐기되는 것 방지
        em.clear();
        return entity;
    }

    /* 클레임 아이템 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        OdClaimItem entity = findById(id);
        // [쿼리 메서드] 클레임 항목 (클레임 대상 주문상품 명세) 삭제
        odClaimItemRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public OdClaimItem saveOneBase(OdClaimItem entity) {
        String rowStatus  = entity.getRowStatus();
        String authId     = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
        rowStatus = entity.resolveRowStatus(entity.getClaimItemId());

        if ("D".equals(rowStatus)) {
            if (entity.getClaimItemId() == null)
                throw new CmBizException("삭제 대상 claimItemId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            // [쿼리 메서드] 클레임 항목 (클레임 대상 주문상품 명세) 존재 여부 확인
            if (!odClaimItemRepository.existsById(entity.getClaimItemId()))
                throw new CmBizException("존재하지 않는 OdClaimItem입니다: " + entity.getClaimItemId() + "::" + CmUtil.svcCallerInfo(this));
            // [쿼리 메서드] 클레임 항목 (클레임 대상 주문상품 명세) ID 기준 삭제
            odClaimItemRepository.deleteById(entity.getClaimItemId());
            return null;
        } else if ("I".equals(rowStatus)) {
            entity.setClaimItemId(CmUtil.generateId("od_claim_item"));
            entity.setRegBy(authId); entity.setRegDate(now);
            entity.setUpdBy(authId); entity.setUpdDate(now);
            // [쿼리 메서드] 클레임 항목 (클레임 대상 주문상품 명세) 저장
            OdClaimItem saved = odClaimItemRepository.save(entity);
            if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
            return saved;
        } else if ("U".equals(rowStatus)) {
            if (entity.getClaimItemId() == null)
                throw new CmBizException("수정 대상 claimItemId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            entity.setUpdBy(authId);
            // [QueryDSL] 클레임 항목 (클레임 대상 주문상품 명세) 선택적 필드 수정
            int affected = odClaimItemRepository.updateSelective(entity);
            if (affected == 0)
                throw new CmBizException("존재하지 않는 OdClaimItem입니다: " + entity.getClaimItemId() + "::" + CmUtil.svcCallerInfo(this));
            em.flush();   // clear() 전 필수 — 보류 중인 INSERT/UPDATE 가 clear 로 폐기되는 것 방지
            em.clear();
            return findById(entity.getClaimItemId());
        }
        throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));

    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveListBase(List<OdClaimItem> rows) {
        /* 0단계: rowStatus 정규화 */
        for (OdClaimItem row : rows) {
            String rs = row.getRowStatus();
            if ("M".equals(rs) || rs == null || rs.isBlank()) {
                row.setRowStatus((row.getClaimItemId() == null || row.getClaimItemId().isBlank()) ? "I" : "U");
            } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
            }
        }
        CmUtil.requireRowIds(rows, OdClaimItem::getClaimItemId, "U", "claimItemId", this);
        CmUtil.requireRowIds(rows, OdClaimItem::getClaimItemId, "D", "claimItemId", this);
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()))
            .map(OdClaimItem::getClaimItemId)
            .toList();
        if (!deleteIds.isEmpty()) {
            // [쿼리 메서드] 클레임 항목 (클레임 대상 주문상품 명세) 조건별 삭제
            odClaimItemRepository.deleteAllById(deleteIds);
        }

        // 2단계: UPDATE - updateSelective
        List<OdClaimItem> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()))
            .toList();
        for (OdClaimItem row : updateRows) {
            row.setUpdBy(authId);
            // [QueryDSL] 클레임 항목 (클레임 대상 주문상품 명세) 선택적 필드 수정
            int affected = odClaimItemRepository.updateSelective(row);
            if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getClaimItemId() + "::" + CmUtil.svcCallerInfo(this));
        }

        // 3단계: INSERT
        List<OdClaimItem> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (OdClaimItem row : insertRows) {
            row.setClaimItemId(CmUtil.generateId("od_claim_item"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            // [쿼리 메서드] 클레임 항목 (클레임 대상 주문상품 명세) 저장
            odClaimItemRepository.save(row);
        }

        // 4단계: 영속성 컨텍스트 동기화
        em.flush();
        em.clear();
        return;

    }
}

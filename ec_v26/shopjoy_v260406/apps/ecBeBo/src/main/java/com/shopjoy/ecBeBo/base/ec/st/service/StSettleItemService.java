package com.shopjoy.ecBeBo.base.ec.st.service;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.ec.st.data.dto.StSettleItemDto;
import com.shopjoy.ecBeBo.base.ec.st.data.entity.StSettleItem;
import com.shopjoy.ecBeBo.base.ec.st.repository.StSettleItemRepository;
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
public class StSettleItemService {

    private final StSettleItemRepository stSettleItemRepository;

    @PersistenceContext
    private EntityManager em;

    /* 정산 항목 키조회 */
    public StSettleItemDto.Item getById(String id) {
        // [QueryDSL] 정산 항목 (주문항목별 명세) 단건 조회
        StSettleItemDto.Item dto = stSettleItemRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public StSettleItemDto.Item getByIdOrNull(String id) {
        // [QueryDSL] 정산 항목 (주문항목별 명세) 단건 조회
        return stSettleItemRepository.selectById(id).orElse(null);
    }

    /* 정산 항목 상세조회 */
    public StSettleItem findById(String id) {
        // [쿼리 메서드] 정산 항목 (주문항목별 명세) 단건 조회
        return stSettleItemRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public StSettleItem findByIdOrNull(String id) {
        // [쿼리 메서드] 정산 항목 (주문항목별 명세) 단건 조회
        return stSettleItemRepository.findById(id).orElse(null);
    }

    /* 정산 항목 키검증 */
    public boolean existsById(String id) {
        // [쿼리 메서드] 정산 항목 (주문항목별 명세) 존재 여부 확인
        return stSettleItemRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        // [쿼리 메서드] 정산 항목 (주문항목별 명세) 존재 여부 확인
        if (!stSettleItemRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 정산 항목 목록조회 */
    public List<StSettleItemDto.Item> getList(StSettleItemDto.Request req) {
        // [QueryDSL] 정산 항목 (주문항목별 명세) 목록 조회
        return stSettleItemRepository.selectList(req);
    }

    /* 정산 항목 페이지조회 */
    public BasePage<StSettleItemDto.Item> getPageData(StSettleItemDto.Request req) {
        PageHelper.addPaging(req);
        // [QueryDSL] 정산 항목 (주문항목별 명세) 페이지 조회
        return stSettleItemRepository.selectPageData(req);
    }

    /* 정산 항목 등록 */
    @Transactional
    public StSettleItem create(StSettleItem body) {
        body.setSettleItemId(CmUtil.generateId("st_settle_item"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        // [쿼리 메서드] 정산 항목 (주문항목별 명세) 저장
        StSettleItem saved = stSettleItemRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 정산 항목 수정 */
    @Transactional
    public StSettleItem update(String id, StSettleItem body) {
        CmUtil.requireId(id, "id", this);
        StSettleItem entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "settleItemId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // [쿼리 메서드] 정산 항목 (주문항목별 명세) 저장
        StSettleItem saved = stSettleItemRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 정산 항목 수정 */
    @Transactional
    public StSettleItem updateSelective(StSettleItem entity) {
        if (entity.getSettleItemId() == null) throw new CmBizException("settleItemId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getSettleItemId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getSettleItemId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // [QueryDSL] 정산 항목 (주문항목별 명세) 선택적 필드 수정
        int affected = stSettleItemRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();   // clear() 전 필수 — 보류 중인 INSERT/UPDATE 가 clear 로 폐기되는 것 방지
        em.clear();
        return entity;
    }

    /* 정산 항목 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        StSettleItem entity = findById(id);
        // [쿼리 메서드] 정산 항목 (주문항목별 명세) 삭제
        stSettleItemRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public StSettleItem saveOneBase(StSettleItem entity) {
        String rowStatus  = entity.getRowStatus();
        String authId     = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
        rowStatus = entity.resolveRowStatus(entity.getSettleItemId());

        if ("D".equals(rowStatus)) {
            if (entity.getSettleItemId() == null)
                throw new CmBizException("삭제 대상 settleItemId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            // [쿼리 메서드] 정산 항목 (주문항목별 명세) 존재 여부 확인
            if (!stSettleItemRepository.existsById(entity.getSettleItemId()))
                throw new CmBizException("존재하지 않는 StSettleItem입니다: " + entity.getSettleItemId() + "::" + CmUtil.svcCallerInfo(this));
            // [쿼리 메서드] 정산 항목 (주문항목별 명세) ID 기준 삭제
            stSettleItemRepository.deleteById(entity.getSettleItemId());
            return null;
        } else if ("I".equals(rowStatus)) {
            entity.setSettleItemId(CmUtil.generateId("st_settle_item"));
            entity.setRegBy(authId); entity.setRegDate(now);
            entity.setUpdBy(authId); entity.setUpdDate(now);
            // [쿼리 메서드] 정산 항목 (주문항목별 명세) 저장
            StSettleItem saved = stSettleItemRepository.save(entity);
            if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
            return saved;
        } else if ("U".equals(rowStatus)) {
            if (entity.getSettleItemId() == null)
                throw new CmBizException("수정 대상 settleItemId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            entity.setUpdBy(authId);
            // [QueryDSL] 정산 항목 (주문항목별 명세) 선택적 필드 수정
            int affected = stSettleItemRepository.updateSelective(entity);
            if (affected == 0)
                throw new CmBizException("존재하지 않는 StSettleItem입니다: " + entity.getSettleItemId() + "::" + CmUtil.svcCallerInfo(this));
            em.flush();   // clear() 전 필수 — 보류 중인 INSERT/UPDATE 가 clear 로 폐기되는 것 방지
            em.clear();
            return findById(entity.getSettleItemId());
        }
        throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));

    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveListBase(List<StSettleItem> rows) {
        /* 0단계: rowStatus 정규화 */
        for (StSettleItem row : rows) {
            String rs = row.getRowStatus();
            if ("M".equals(rs) || rs == null || rs.isBlank()) {
                row.setRowStatus((row.getSettleItemId() == null || row.getSettleItemId().isBlank()) ? "I" : "U");
            } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
            }
        }
        CmUtil.requireRowIds(rows, StSettleItem::getSettleItemId, "U", "settleItemId", this);
        CmUtil.requireRowIds(rows, StSettleItem::getSettleItemId, "D", "settleItemId", this);
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()))
            .map(StSettleItem::getSettleItemId)
            .toList();
        if (!deleteIds.isEmpty()) {
            // [쿼리 메서드] 정산 항목 (주문항목별 명세) 조건별 삭제
            stSettleItemRepository.deleteAllById(deleteIds);
        }

        // 2단계: UPDATE - updateSelective
        List<StSettleItem> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()))
            .toList();
        for (StSettleItem row : updateRows) {
            row.setUpdBy(authId);
            // [QueryDSL] 정산 항목 (주문항목별 명세) 선택적 필드 수정
            int affected = stSettleItemRepository.updateSelective(row);
            if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getSettleItemId() + "::" + CmUtil.svcCallerInfo(this));
        }

        // 3단계: INSERT
        List<StSettleItem> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (StSettleItem row : insertRows) {
            row.setSettleItemId(CmUtil.generateId("st_settle_item"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            // [쿼리 메서드] 정산 항목 (주문항목별 명세) 저장
            stSettleItemRepository.save(row);
        }

        // 4단계: 영속성 컨텍스트 동기화
        em.flush();
        em.clear();
        return;

    }
}

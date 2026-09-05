package com.shopjoy.ecadminapi.base.ec.st.service;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettlePayDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettlePay;
import com.shopjoy.ecadminapi.base.ec.st.repository.StSettlePayRepository;
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
public class StSettlePayService {

    private final StSettlePayRepository stSettlePayRepository;

    @PersistenceContext
    private EntityManager em;

    /* 정산 지급 키조회 */
    public StSettlePayDto.Item getById(String id) {
        // [QueryDSL] 정산지급 단건 조회
        StSettlePayDto.Item dto = stSettlePayRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public StSettlePayDto.Item getByIdOrNull(String id) {
        // [QueryDSL] 정산지급 단건 조회
        return stSettlePayRepository.selectById(id).orElse(null);
    }

    /* 정산 지급 상세조회 */
    public StSettlePay findById(String id) {
        // [쿼리 메서드] 정산지급 단건 조회
        return stSettlePayRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public StSettlePay findByIdOrNull(String id) {
        // [쿼리 메서드] 정산지급 단건 조회
        return stSettlePayRepository.findById(id).orElse(null);
    }

    /* 정산 지급 키검증 */
    public boolean existsById(String id) {
        // [쿼리 메서드] 정산지급 존재 여부 확인
        return stSettlePayRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        // [쿼리 메서드] 정산지급 존재 여부 확인
        if (!stSettlePayRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 정산 지급 목록조회 */
    public List<StSettlePayDto.Item> getList(StSettlePayDto.Request req) {
        // [QueryDSL] 정산지급 목록 조회
        return stSettlePayRepository.selectList(req);
    }

    /* 정산 지급 페이지조회 */
    public BasePage<StSettlePayDto.Item> getPageData(StSettlePayDto.Request req) {
        PageHelper.addPaging(req);
        // [QueryDSL] 정산지급 페이지 조회
        return stSettlePayRepository.selectPageData(req);
    }

    /* 정산 지급 등록 */
    @Transactional
    public StSettlePay create(StSettlePay body) {
        body.setSettlePayId(CmUtil.generateId("st_settle_pay"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        // [쿼리 메서드] 정산지급 저장
        StSettlePay saved = stSettlePayRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 정산 지급 수정 */
    @Transactional
    public StSettlePay update(String id, StSettlePay body) {
        CmUtil.requireId(id, "id", this);
        StSettlePay entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "settlePayId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // [쿼리 메서드] 정산지급 저장
        StSettlePay saved = stSettlePayRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 정산 지급 수정 */
    @Transactional
    public StSettlePay updateSelective(StSettlePay entity) {
        if (entity.getSettlePayId() == null) throw new CmBizException("settlePayId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getSettlePayId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getSettlePayId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // [QueryDSL] 정산지급 선택적 필드 수정
        int affected = stSettlePayRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();   // clear() 전 필수 — 보류 중인 INSERT/UPDATE 가 clear 로 폐기되는 것 방지
        em.clear();
        return entity;
    }

    /* 정산 지급 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        StSettlePay entity = findById(id);
        // [쿼리 메서드] 정산지급 삭제
        stSettlePayRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public StSettlePay saveOneBase(StSettlePay entity) {
        String rowStatus  = entity.getRowStatus();
        String authId     = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
        rowStatus = entity.resolveRowStatus(entity.getSettlePayId());

        if ("D".equals(rowStatus)) {
            if (entity.getSettlePayId() == null)
                throw new CmBizException("삭제 대상 settlePayId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            // [쿼리 메서드] 정산지급 존재 여부 확인
            if (!stSettlePayRepository.existsById(entity.getSettlePayId()))
                throw new CmBizException("존재하지 않는 StSettlePay입니다: " + entity.getSettlePayId() + "::" + CmUtil.svcCallerInfo(this));
            // [쿼리 메서드] 정산지급 ID 기준 삭제
            stSettlePayRepository.deleteById(entity.getSettlePayId());
            return null;
        } else if ("I".equals(rowStatus)) {
            entity.setSettlePayId(CmUtil.generateId("st_settle_pay"));
            entity.setRegBy(authId); entity.setRegDate(now);
            entity.setUpdBy(authId); entity.setUpdDate(now);
            // [쿼리 메서드] 정산지급 저장
            StSettlePay saved = stSettlePayRepository.save(entity);
            if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
            return saved;
        } else if ("U".equals(rowStatus)) {
            if (entity.getSettlePayId() == null)
                throw new CmBizException("수정 대상 settlePayId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            entity.setUpdBy(authId);
            // [QueryDSL] 정산지급 선택적 필드 수정
            int affected = stSettlePayRepository.updateSelective(entity);
            if (affected == 0)
                throw new CmBizException("존재하지 않는 StSettlePay입니다: " + entity.getSettlePayId() + "::" + CmUtil.svcCallerInfo(this));
            em.flush();   // clear() 전 필수 — 보류 중인 INSERT/UPDATE 가 clear 로 폐기되는 것 방지
            em.clear();
            return findById(entity.getSettlePayId());
        }
        throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));

    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveListBase(List<StSettlePay> rows) {
        /* 0단계: rowStatus 정규화 */
        for (StSettlePay row : rows) {
            String rs = row.getRowStatus();
            if ("M".equals(rs) || rs == null || rs.isBlank()) {
                row.setRowStatus((row.getSettlePayId() == null || row.getSettlePayId().isBlank()) ? "I" : "U");
            } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
            }
        }
        CmUtil.requireRowIds(rows, StSettlePay::getSettlePayId, "U", "settlePayId", this);
        CmUtil.requireRowIds(rows, StSettlePay::getSettlePayId, "D", "settlePayId", this);
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()))
            .map(StSettlePay::getSettlePayId)
            .toList();
        if (!deleteIds.isEmpty()) {
            // [쿼리 메서드] 정산지급 조건별 삭제
            stSettlePayRepository.deleteAllById(deleteIds);
        }

        // 2단계: UPDATE - updateSelective
        List<StSettlePay> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()))
            .toList();
        for (StSettlePay row : updateRows) {
            row.setUpdBy(authId);
            // [QueryDSL] 정산지급 선택적 필드 수정
            int affected = stSettlePayRepository.updateSelective(row);
            if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getSettlePayId() + "::" + CmUtil.svcCallerInfo(this));
        }

        // 3단계: INSERT
        List<StSettlePay> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (StSettlePay row : insertRows) {
            row.setSettlePayId(CmUtil.generateId("st_settle_pay"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            // [쿼리 메서드] 정산지급 저장
            stSettlePayRepository.save(row);
        }

        // 4단계: 영속성 컨텍스트 동기화
        em.flush();
        em.clear();
        return;

    }
}

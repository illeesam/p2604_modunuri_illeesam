package com.shopjoy.ecadminapi.base.ec.st.service;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleAdjDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleAdj;
import com.shopjoy.ecadminapi.base.ec.st.repository.StSettleAdjRepository;
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
public class StSettleAdjService {

    private final StSettleAdjRepository stSettleAdjRepository;

    @PersistenceContext
    private EntityManager em;

    /* 정산 조정 키조회 */
    public StSettleAdjDto.Item getById(String id) {
        // [QueryDSL] 정산조정 단건 조회
        StSettleAdjDto.Item dto = stSettleAdjRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public StSettleAdjDto.Item getByIdOrNull(String id) {
        // [QueryDSL] 정산조정 단건 조회
        return stSettleAdjRepository.selectById(id).orElse(null);
    }

    /* 정산 조정 상세조회 */
    public StSettleAdj findById(String id) {
        // [쿼리 메서드] 정산조정 단건 조회
        return stSettleAdjRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public StSettleAdj findByIdOrNull(String id) {
        // [쿼리 메서드] 정산조정 단건 조회
        return stSettleAdjRepository.findById(id).orElse(null);
    }

    /* 정산 조정 키검증 */
    public boolean existsById(String id) {
        // [쿼리 메서드] 정산조정 존재 여부 확인
        return stSettleAdjRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        // [쿼리 메서드] 정산조정 존재 여부 확인
        if (!stSettleAdjRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 정산 조정 목록조회 */
    public List<StSettleAdjDto.Item> getList(StSettleAdjDto.Request req) {
        // [QueryDSL] 정산조정 목록 조회
        return stSettleAdjRepository.selectList(req);
    }

    /* 정산 조정 페이지조회 */
    public BasePage<StSettleAdjDto.Item> getPageData(StSettleAdjDto.Request req) {
        PageHelper.addPaging(req);
        // [QueryDSL] 정산조정 페이지 조회
        return stSettleAdjRepository.selectPageData(req);
    }

    /* 정산 조정 등록 */
    @Transactional
    public StSettleAdj create(StSettleAdj body) {
        body.setSettleAdjId(CmUtil.generateId("st_settle_adj"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        // [쿼리 메서드] 정산조정 저장
        StSettleAdj saved = stSettleAdjRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 정산 조정 수정 */
    @Transactional
    public StSettleAdj update(String id, StSettleAdj body) {
        CmUtil.requireId(id, "id", this);
        StSettleAdj entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "settleAdjId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // [쿼리 메서드] 정산조정 저장
        StSettleAdj saved = stSettleAdjRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 정산 조정 수정 */
    @Transactional
    public StSettleAdj updateSelective(StSettleAdj entity) {
        if (entity.getSettleAdjId() == null) throw new CmBizException("settleAdjId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getSettleAdjId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getSettleAdjId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // [QueryDSL] 정산조정 선택적 필드 수정
        int affected = stSettleAdjRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();   // clear() 전 필수 — 보류 중인 INSERT/UPDATE 가 clear 로 폐기되는 것 방지
        em.clear();
        return entity;
    }

    /* 정산 조정 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        StSettleAdj entity = findById(id);
        // [쿼리 메서드] 정산조정 삭제
        stSettleAdjRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public StSettleAdj saveOneBase(StSettleAdj entity) {
        String rowStatus  = entity.getRowStatus();
        String authId     = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
        rowStatus = entity.resolveRowStatus(entity.getSettleAdjId());

        if ("D".equals(rowStatus)) {
            if (entity.getSettleAdjId() == null)
                throw new CmBizException("삭제 대상 settleAdjId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            // [쿼리 메서드] 정산조정 존재 여부 확인
            if (!stSettleAdjRepository.existsById(entity.getSettleAdjId()))
                throw new CmBizException("존재하지 않는 StSettleAdj입니다: " + entity.getSettleAdjId() + "::" + CmUtil.svcCallerInfo(this));
            // [쿼리 메서드] 정산조정 ID 기준 삭제
            stSettleAdjRepository.deleteById(entity.getSettleAdjId());
            return null;
        } else if ("I".equals(rowStatus)) {
            entity.setSettleAdjId(CmUtil.generateId("st_settle_adj"));
            entity.setRegBy(authId); entity.setRegDate(now);
            entity.setUpdBy(authId); entity.setUpdDate(now);
            // [쿼리 메서드] 정산조정 저장
            StSettleAdj saved = stSettleAdjRepository.save(entity);
            if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
            return saved;
        } else if ("U".equals(rowStatus)) {
            if (entity.getSettleAdjId() == null)
                throw new CmBizException("수정 대상 settleAdjId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            entity.setUpdBy(authId);
            // [QueryDSL] 정산조정 선택적 필드 수정
            int affected = stSettleAdjRepository.updateSelective(entity);
            if (affected == 0)
                throw new CmBizException("존재하지 않는 StSettleAdj입니다: " + entity.getSettleAdjId() + "::" + CmUtil.svcCallerInfo(this));
            em.flush();   // clear() 전 필수 — 보류 중인 INSERT/UPDATE 가 clear 로 폐기되는 것 방지
            em.clear();
            return findById(entity.getSettleAdjId());
        }
        throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));

    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveListBase(List<StSettleAdj> rows) {
        /* 0단계: rowStatus 정규화 */
        for (StSettleAdj row : rows) {
            String rs = row.getRowStatus();
            if ("M".equals(rs) || rs == null || rs.isBlank()) {
                row.setRowStatus((row.getSettleAdjId() == null || row.getSettleAdjId().isBlank()) ? "I" : "U");
            } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
            }
        }
        CmUtil.requireRowIds(rows, StSettleAdj::getSettleAdjId, "U", "settleAdjId", this);
        CmUtil.requireRowIds(rows, StSettleAdj::getSettleAdjId, "D", "settleAdjId", this);
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()))
            .map(StSettleAdj::getSettleAdjId)
            .toList();
        if (!deleteIds.isEmpty()) {
            // [쿼리 메서드] 정산조정 조건별 삭제
            stSettleAdjRepository.deleteAllById(deleteIds);
        }

        // 2단계: UPDATE - updateSelective
        List<StSettleAdj> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()))
            .toList();
        for (StSettleAdj row : updateRows) {
            row.setUpdBy(authId);
            // [QueryDSL] 정산조정 선택적 필드 수정
            int affected = stSettleAdjRepository.updateSelective(row);
            if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getSettleAdjId() + "::" + CmUtil.svcCallerInfo(this));
        }

        // 3단계: INSERT
        List<StSettleAdj> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (StSettleAdj row : insertRows) {
            row.setSettleAdjId(CmUtil.generateId("st_settle_adj"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            // [쿼리 메서드] 정산조정 저장
            stSettleAdjRepository.save(row);
        }

        // 4단계: 영속성 컨텍스트 동기화
        em.flush();
        em.clear();
        return;

    }
}

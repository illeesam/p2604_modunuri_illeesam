package com.shopjoy.ecBeBo.base.ec.od.service;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.ec.od.data.dto.OdRefundDto;
import com.shopjoy.ecBeBo.base.ec.od.data.entity.OdRefund;
import com.shopjoy.ecBeBo.base.ec.od.repository.OdRefundRepository;
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
public class OdRefundService {

    private final OdRefundRepository odRefundRepository;

    @PersistenceContext
    private EntityManager em;

    /* 환불 키조회 */
    public OdRefundDto.Item getById(String id) {
        // [QueryDSL] 환불 마스터 (클레임 건별 환불 총괄) 단건 조회
        OdRefundDto.Item dto = odRefundRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public OdRefundDto.Item getByIdOrNull(String id) {
        // [QueryDSL] 환불 마스터 (클레임 건별 환불 총괄) 단건 조회
        return odRefundRepository.selectById(id).orElse(null);
    }

    /* 환불 상세조회 */
    public OdRefund findById(String id) {
        // [쿼리 메서드] 환불 마스터 (클레임 건별 환불 총괄) 단건 조회
        return odRefundRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public OdRefund findByIdOrNull(String id) {
        // [쿼리 메서드] 환불 마스터 (클레임 건별 환불 총괄) 단건 조회
        return odRefundRepository.findById(id).orElse(null);
    }

    /* 환불 키검증 */
    public boolean existsById(String id) {
        // [쿼리 메서드] 환불 마스터 (클레임 건별 환불 총괄) 존재 여부 확인
        return odRefundRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        // [쿼리 메서드] 환불 마스터 (클레임 건별 환불 총괄) 존재 여부 확인
        if (!odRefundRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 환불 목록조회 */
    public List<OdRefundDto.Item> getList(OdRefundDto.Request req) {
        // [QueryDSL] 환불 마스터 (클레임 건별 환불 총괄) 목록 조회
        return odRefundRepository.selectList(req);
    }

    /* 환불 페이지조회 */
    public BasePage<OdRefundDto.Item> getPageData(OdRefundDto.Request req) {
        PageHelper.addPaging(req);
        // [QueryDSL] 환불 마스터 (클레임 건별 환불 총괄) 페이지 조회
        return odRefundRepository.selectPageData(req);
    }

    /* 환불 등록 */
    @Transactional
    public OdRefund create(OdRefund body) {
        body.setRefundId(CmUtil.generateId("od_refund"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        // [쿼리 메서드] 환불 마스터 (클레임 건별 환불 총괄) 저장
        OdRefund saved = odRefundRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 환불 수정 */
    @Transactional
    public OdRefund update(String id, OdRefund body) {
        CmUtil.requireId(id, "id", this);
        OdRefund entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "refundId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // [쿼리 메서드] 환불 마스터 (클레임 건별 환불 총괄) 저장
        OdRefund saved = odRefundRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 환불 수정 */
    @Transactional
    public OdRefund updateSelective(OdRefund entity) {
        if (entity.getRefundId() == null) throw new CmBizException("refundId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getRefundId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getRefundId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // [QueryDSL] 환불 마스터 (클레임 건별 환불 총괄) 선택적 필드 수정
        int affected = odRefundRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();   // clear() 전 필수 — 보류 중인 INSERT/UPDATE 가 clear 로 폐기되는 것 방지
        em.clear();
        return entity;
    }

    /* 환불 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        OdRefund entity = findById(id);
        // [쿼리 메서드] 환불 마스터 (클레임 건별 환불 총괄) 삭제
        odRefundRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public OdRefund saveOneBase(OdRefund entity) {
        String rowStatus  = entity.getRowStatus();
        String authId     = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
        rowStatus = entity.resolveRowStatus(entity.getRefundId());

        if ("D".equals(rowStatus)) {
            if (entity.getRefundId() == null)
                throw new CmBizException("삭제 대상 refundId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            // [쿼리 메서드] 환불 마스터 (클레임 건별 환불 총괄) 존재 여부 확인
            if (!odRefundRepository.existsById(entity.getRefundId()))
                throw new CmBizException("존재하지 않는 OdRefund입니다: " + entity.getRefundId() + "::" + CmUtil.svcCallerInfo(this));
            // [쿼리 메서드] 환불 마스터 (클레임 건별 환불 총괄) ID 기준 삭제
            odRefundRepository.deleteById(entity.getRefundId());
            return null;
        } else if ("I".equals(rowStatus)) {
            entity.setRefundId(CmUtil.generateId("od_refund"));
            entity.setRegBy(authId); entity.setRegDate(now);
            entity.setUpdBy(authId); entity.setUpdDate(now);
            // [쿼리 메서드] 환불 마스터 (클레임 건별 환불 총괄) 저장
            OdRefund saved = odRefundRepository.save(entity);
            if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
            return saved;
        } else if ("U".equals(rowStatus)) {
            if (entity.getRefundId() == null)
                throw new CmBizException("수정 대상 refundId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            entity.setUpdBy(authId);
            // [QueryDSL] 환불 마스터 (클레임 건별 환불 총괄) 선택적 필드 수정
            int affected = odRefundRepository.updateSelective(entity);
            if (affected == 0)
                throw new CmBizException("존재하지 않는 OdRefund입니다: " + entity.getRefundId() + "::" + CmUtil.svcCallerInfo(this));
            em.flush();   // clear() 전 필수 — 보류 중인 INSERT/UPDATE 가 clear 로 폐기되는 것 방지
            em.clear();
            return findById(entity.getRefundId());
        }
        throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));

    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveListBase(List<OdRefund> rows) {
        /* 0단계: rowStatus 정규화 */
        for (OdRefund row : rows) {
            String rs = row.getRowStatus();
            if ("M".equals(rs) || rs == null || rs.isBlank()) {
                row.setRowStatus((row.getRefundId() == null || row.getRefundId().isBlank()) ? "I" : "U");
            } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
            }
        }
        CmUtil.requireRowIds(rows, OdRefund::getRefundId, "U", "refundId", this);
        CmUtil.requireRowIds(rows, OdRefund::getRefundId, "D", "refundId", this);
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()))
            .map(OdRefund::getRefundId)
            .toList();
        if (!deleteIds.isEmpty()) {
            // [쿼리 메서드] 환불 마스터 (클레임 건별 환불 총괄) 조건별 삭제
            odRefundRepository.deleteAllById(deleteIds);
        }

        // 2단계: UPDATE - updateSelective
        List<OdRefund> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()))
            .toList();
        for (OdRefund row : updateRows) {
            row.setUpdBy(authId);
            // [QueryDSL] 환불 마스터 (클레임 건별 환불 총괄) 선택적 필드 수정
            int affected = odRefundRepository.updateSelective(row);
            if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getRefundId() + "::" + CmUtil.svcCallerInfo(this));
        }

        // 3단계: INSERT
        List<OdRefund> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (OdRefund row : insertRows) {
            row.setRefundId(CmUtil.generateId("od_refund"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            // [쿼리 메서드] 환불 마스터 (클레임 건별 환불 총괄) 저장
            odRefundRepository.save(row);
        }

        // 4단계: 영속성 컨텍스트 동기화
        em.flush();
        em.clear();
        return;

    }
}

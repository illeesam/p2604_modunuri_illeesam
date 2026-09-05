package com.shopjoy.ecBeBo.base.ec.st.service;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.ec.st.data.dto.StErpVoucherLineDto;
import com.shopjoy.ecBeBo.base.ec.st.data.entity.StErpVoucherLine;
import com.shopjoy.ecBeBo.base.ec.st.repository.StErpVoucherLineRepository;
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
public class StErpVoucherLineService {

    private final StErpVoucherLineRepository stErpVoucherLineRepository;

    @PersistenceContext
    private EntityManager em;

    /* ERP 전표 상세 키조회 */
    public StErpVoucherLineDto.Item getById(String id) {
        // [QueryDSL] ERP 전표 라인 (분개 항목, 차변/대변 1행씩) 단건 조회
        StErpVoucherLineDto.Item dto = stErpVoucherLineRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public StErpVoucherLineDto.Item getByIdOrNull(String id) {
        // [QueryDSL] ERP 전표 라인 (분개 항목, 차변/대변 1행씩) 단건 조회
        return stErpVoucherLineRepository.selectById(id).orElse(null);
    }

    /* ERP 전표 상세 상세조회 */
    public StErpVoucherLine findById(String id) {
        // [쿼리 메서드] ERP 전표 라인 (분개 항목, 차변/대변 1행씩) 단건 조회
        return stErpVoucherLineRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public StErpVoucherLine findByIdOrNull(String id) {
        // [쿼리 메서드] ERP 전표 라인 (분개 항목, 차변/대변 1행씩) 단건 조회
        return stErpVoucherLineRepository.findById(id).orElse(null);
    }

    /* ERP 전표 상세 키검증 */
    public boolean existsById(String id) {
        // [쿼리 메서드] ERP 전표 라인 (분개 항목, 차변/대변 1행씩) 존재 여부 확인
        return stErpVoucherLineRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        // [쿼리 메서드] ERP 전표 라인 (분개 항목, 차변/대변 1행씩) 존재 여부 확인
        if (!stErpVoucherLineRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* ERP 전표 상세 목록조회 */
    public List<StErpVoucherLineDto.Item> getList(StErpVoucherLineDto.Request req) {
        // [QueryDSL] ERP 전표 라인 (분개 항목, 차변/대변 1행씩) 목록 조회
        return stErpVoucherLineRepository.selectList(req);
    }

    /* ERP 전표 상세 페이지조회 */
    public BasePage<StErpVoucherLineDto.Item> getPageData(StErpVoucherLineDto.Request req) {
        PageHelper.addPaging(req);
        // [QueryDSL] ERP 전표 라인 (분개 항목, 차변/대변 1행씩) 페이지 조회
        return stErpVoucherLineRepository.selectPageData(req);
    }

    /* ERP 전표 상세 등록 */
    @Transactional
    public StErpVoucherLine create(StErpVoucherLine body) {
        body.setErpVoucherLineId(CmUtil.generateId("st_erp_voucher_line"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        // [쿼리 메서드] ERP 전표 라인 (분개 항목, 차변/대변 1행씩) 저장
        StErpVoucherLine saved = stErpVoucherLineRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* ERP 전표 상세 수정 */
    @Transactional
    public StErpVoucherLine update(String id, StErpVoucherLine body) {
        CmUtil.requireId(id, "id", this);
        StErpVoucherLine entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "erpVoucherLineId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // [쿼리 메서드] ERP 전표 라인 (분개 항목, 차변/대변 1행씩) 저장
        StErpVoucherLine saved = stErpVoucherLineRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* ERP 전표 상세 수정 */
    @Transactional
    public StErpVoucherLine updateSelective(StErpVoucherLine entity) {
        if (entity.getErpVoucherLineId() == null) throw new CmBizException("erpVoucherLineId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getErpVoucherLineId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getErpVoucherLineId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // [QueryDSL] ERP 전표 라인 (분개 항목, 차변/대변 1행씩) 선택적 필드 수정
        int affected = stErpVoucherLineRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();   // clear() 전 필수 — 보류 중인 INSERT/UPDATE 가 clear 로 폐기되는 것 방지
        em.clear();
        return entity;
    }

    /* ERP 전표 상세 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        StErpVoucherLine entity = findById(id);
        // [쿼리 메서드] ERP 전표 라인 (분개 항목, 차변/대변 1행씩) 삭제
        stErpVoucherLineRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public StErpVoucherLine saveOneBase(StErpVoucherLine entity) {
        String rowStatus  = entity.getRowStatus();
        String authId     = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
        rowStatus = entity.resolveRowStatus(entity.getErpVoucherLineId());

        if ("D".equals(rowStatus)) {
            if (entity.getErpVoucherLineId() == null)
                throw new CmBizException("삭제 대상 erpVoucherLineId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            // [쿼리 메서드] ERP 전표 라인 (분개 항목, 차변/대변 1행씩) 존재 여부 확인
            if (!stErpVoucherLineRepository.existsById(entity.getErpVoucherLineId()))
                throw new CmBizException("존재하지 않는 StErpVoucherLine입니다: " + entity.getErpVoucherLineId() + "::" + CmUtil.svcCallerInfo(this));
            // [쿼리 메서드] ERP 전표 라인 (분개 항목, 차변/대변 1행씩) ID 기준 삭제
            stErpVoucherLineRepository.deleteById(entity.getErpVoucherLineId());
            return null;
        } else if ("I".equals(rowStatus)) {
            entity.setErpVoucherLineId(CmUtil.generateId("st_erp_voucher_line"));
            entity.setRegBy(authId); entity.setRegDate(now);
            entity.setUpdBy(authId); entity.setUpdDate(now);
            // [쿼리 메서드] ERP 전표 라인 (분개 항목, 차변/대변 1행씩) 저장
            StErpVoucherLine saved = stErpVoucherLineRepository.save(entity);
            if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
            return saved;
        } else if ("U".equals(rowStatus)) {
            if (entity.getErpVoucherLineId() == null)
                throw new CmBizException("수정 대상 erpVoucherLineId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            entity.setUpdBy(authId);
            // [QueryDSL] ERP 전표 라인 (분개 항목, 차변/대변 1행씩) 선택적 필드 수정
            int affected = stErpVoucherLineRepository.updateSelective(entity);
            if (affected == 0)
                throw new CmBizException("존재하지 않는 StErpVoucherLine입니다: " + entity.getErpVoucherLineId() + "::" + CmUtil.svcCallerInfo(this));
            em.flush();   // clear() 전 필수 — 보류 중인 INSERT/UPDATE 가 clear 로 폐기되는 것 방지
            em.clear();
            return findById(entity.getErpVoucherLineId());
        }
        throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));

    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveListBase(List<StErpVoucherLine> rows) {
        /* 0단계: rowStatus 정규화 */
        for (StErpVoucherLine row : rows) {
            String rs = row.getRowStatus();
            if ("M".equals(rs) || rs == null || rs.isBlank()) {
                row.setRowStatus((row.getErpVoucherLineId() == null || row.getErpVoucherLineId().isBlank()) ? "I" : "U");
            } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
            }
        }
        CmUtil.requireRowIds(rows, StErpVoucherLine::getErpVoucherLineId, "U", "erpVoucherLineId", this);
        CmUtil.requireRowIds(rows, StErpVoucherLine::getErpVoucherLineId, "D", "erpVoucherLineId", this);
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()))
            .map(StErpVoucherLine::getErpVoucherLineId)
            .toList();
        if (!deleteIds.isEmpty()) {
            // [쿼리 메서드] ERP 전표 라인 (분개 항목, 차변/대변 1행씩) 조건별 삭제
            stErpVoucherLineRepository.deleteAllById(deleteIds);
        }

        // 2단계: UPDATE - updateSelective
        List<StErpVoucherLine> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()))
            .toList();
        for (StErpVoucherLine row : updateRows) {
            row.setUpdBy(authId);
            // [QueryDSL] ERP 전표 라인 (분개 항목, 차변/대변 1행씩) 선택적 필드 수정
            int affected = stErpVoucherLineRepository.updateSelective(row);
            if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getErpVoucherLineId() + "::" + CmUtil.svcCallerInfo(this));
        }

        // 3단계: INSERT
        List<StErpVoucherLine> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (StErpVoucherLine row : insertRows) {
            row.setErpVoucherLineId(CmUtil.generateId("st_erp_voucher_line"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            // [쿼리 메서드] ERP 전표 라인 (분개 항목, 차변/대변 1행씩) 저장
            stErpVoucherLineRepository.save(row);
        }

        // 4단계: 영속성 컨텍스트 동기화
        em.flush();
        em.clear();
        return;

    }
}

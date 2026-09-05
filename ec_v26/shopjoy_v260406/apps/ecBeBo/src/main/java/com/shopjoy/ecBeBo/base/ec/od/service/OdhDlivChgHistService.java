package com.shopjoy.ecBeBo.base.ec.od.service;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.ec.od.data.dto.OdhDlivChgHistDto;
import com.shopjoy.ecBeBo.base.ec.od.data.entity.OdhDlivChgHist;
import com.shopjoy.ecBeBo.base.ec.od.repository.OdhDlivChgHistRepository;
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
public class OdhDlivChgHistService {

    private final OdhDlivChgHistRepository odhDlivChgHistRepository;

    @PersistenceContext
    private EntityManager em;

    /* 배송 변경 이력 키조회 */
    public OdhDlivChgHistDto.Item getById(String id) {
        // [QueryDSL] 배송 변경 이력 단건 조회
        OdhDlivChgHistDto.Item dto = odhDlivChgHistRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public OdhDlivChgHistDto.Item getByIdOrNull(String id) {
        // [QueryDSL] 배송 변경 이력 단건 조회
        return odhDlivChgHistRepository.selectById(id).orElse(null);
    }

    /* 배송 변경 이력 상세조회 */
    public OdhDlivChgHist findById(String id) {
        // [쿼리 메서드] 배송 변경 이력 단건 조회
        return odhDlivChgHistRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public OdhDlivChgHist findByIdOrNull(String id) {
        // [쿼리 메서드] 배송 변경 이력 단건 조회
        return odhDlivChgHistRepository.findById(id).orElse(null);
    }

    /* 배송 변경 이력 키검증 */
    public boolean existsById(String id) {
        // [쿼리 메서드] 배송 변경 이력 존재 여부 확인
        return odhDlivChgHistRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        // [쿼리 메서드] 배송 변경 이력 존재 여부 확인
        if (!odhDlivChgHistRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 배송 변경 이력 목록조회 */
    public List<OdhDlivChgHistDto.Item> getList(OdhDlivChgHistDto.Request req) {
        // [QueryDSL] 배송 변경 이력 목록 조회
        return odhDlivChgHistRepository.selectList(req);
    }

    /* 배송 변경 이력 페이지조회 */
    public BasePage<OdhDlivChgHistDto.Item> getPageData(OdhDlivChgHistDto.Request req) {
        PageHelper.addPaging(req);
        // [QueryDSL] 배송 변경 이력 페이지 조회
        return odhDlivChgHistRepository.selectPageData(req);
    }

    /* 배송 변경 이력 등록 */
    @Transactional
    public OdhDlivChgHist create(OdhDlivChgHist body) {
        body.setDlivChgHistId(CmUtil.generateId("odh_dliv_chg_hist"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        // [쿼리 메서드] 배송 변경 이력 저장
        OdhDlivChgHist saved = odhDlivChgHistRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 배송 변경 이력 수정 */
    @Transactional
    public OdhDlivChgHist update(String id, OdhDlivChgHist body) {
        CmUtil.requireId(id, "id", this);
        OdhDlivChgHist entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "dlivChgHistId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // [쿼리 메서드] 배송 변경 이력 저장
        OdhDlivChgHist saved = odhDlivChgHistRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 배송 변경 이력 수정 */
    @Transactional
    public OdhDlivChgHist updateSelective(OdhDlivChgHist entity) {
        if (entity.getDlivChgHistId() == null) throw new CmBizException("dlivChgHistId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getDlivChgHistId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getDlivChgHistId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // [QueryDSL] 배송 변경 이력 선택적 필드 수정
        int affected = odhDlivChgHistRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();   // clear() 전 필수 — 보류 중인 INSERT/UPDATE 가 clear 로 폐기되는 것 방지
        em.clear();
        return entity;
    }

    /* 배송 변경 이력 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        OdhDlivChgHist entity = findById(id);
        // [쿼리 메서드] 배송 변경 이력 삭제
        odhDlivChgHistRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public OdhDlivChgHist saveOneBase(OdhDlivChgHist entity) {
        String rowStatus  = entity.getRowStatus();
        String authId     = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
        rowStatus = entity.resolveRowStatus(entity.getDlivChgHistId());

        if ("D".equals(rowStatus)) {
            if (entity.getDlivChgHistId() == null)
                throw new CmBizException("삭제 대상 dlivChgHistId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            // [쿼리 메서드] 배송 변경 이력 존재 여부 확인
            if (!odhDlivChgHistRepository.existsById(entity.getDlivChgHistId()))
                throw new CmBizException("존재하지 않는 OdhDlivChgHist입니다: " + entity.getDlivChgHistId() + "::" + CmUtil.svcCallerInfo(this));
            // [쿼리 메서드] 배송 변경 이력 ID 기준 삭제
            odhDlivChgHistRepository.deleteById(entity.getDlivChgHistId());
            return null;
        } else if ("I".equals(rowStatus)) {
            entity.setDlivChgHistId(CmUtil.generateId("odh_dliv_chg_hist"));
            entity.setRegBy(authId); entity.setRegDate(now);
            entity.setUpdBy(authId); entity.setUpdDate(now);
            // [쿼리 메서드] 배송 변경 이력 저장
            OdhDlivChgHist saved = odhDlivChgHistRepository.save(entity);
            if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
            return saved;
        } else if ("U".equals(rowStatus)) {
            if (entity.getDlivChgHistId() == null)
                throw new CmBizException("수정 대상 dlivChgHistId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            entity.setUpdBy(authId);
            // [QueryDSL] 배송 변경 이력 선택적 필드 수정
            int affected = odhDlivChgHistRepository.updateSelective(entity);
            if (affected == 0)
                throw new CmBizException("존재하지 않는 OdhDlivChgHist입니다: " + entity.getDlivChgHistId() + "::" + CmUtil.svcCallerInfo(this));
            em.flush();   // clear() 전 필수 — 보류 중인 INSERT/UPDATE 가 clear 로 폐기되는 것 방지
            em.clear();
            return findById(entity.getDlivChgHistId());
        }
        throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));

    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveListBase(List<OdhDlivChgHist> rows) {
        /* 0단계: rowStatus 정규화 */
        for (OdhDlivChgHist row : rows) {
            String rs = row.getRowStatus();
            if ("M".equals(rs) || rs == null || rs.isBlank()) {
                row.setRowStatus((row.getDlivChgHistId() == null || row.getDlivChgHistId().isBlank()) ? "I" : "U");
            } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
            }
        }
        CmUtil.requireRowIds(rows, OdhDlivChgHist::getDlivChgHistId, "U", "dlivChgHistId", this);
        CmUtil.requireRowIds(rows, OdhDlivChgHist::getDlivChgHistId, "D", "dlivChgHistId", this);
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()))
            .map(OdhDlivChgHist::getDlivChgHistId)
            .toList();
        if (!deleteIds.isEmpty()) {
            // [쿼리 메서드] 배송 변경 이력 조건별 삭제
            odhDlivChgHistRepository.deleteAllById(deleteIds);
        }

        // 2단계: UPDATE - updateSelective
        List<OdhDlivChgHist> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()))
            .toList();
        for (OdhDlivChgHist row : updateRows) {
            row.setUpdBy(authId);
            // [QueryDSL] 배송 변경 이력 선택적 필드 수정
            int affected = odhDlivChgHistRepository.updateSelective(row);
            if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getDlivChgHistId() + "::" + CmUtil.svcCallerInfo(this));
        }

        // 3단계: INSERT
        List<OdhDlivChgHist> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (OdhDlivChgHist row : insertRows) {
            row.setDlivChgHistId(CmUtil.generateId("odh_dliv_chg_hist"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            // [쿼리 메서드] 배송 변경 이력 저장
            odhDlivChgHistRepository.save(row);
        }

        // 4단계: 영속성 컨텍스트 동기화
        em.flush();
        em.clear();
        return;

    }
}

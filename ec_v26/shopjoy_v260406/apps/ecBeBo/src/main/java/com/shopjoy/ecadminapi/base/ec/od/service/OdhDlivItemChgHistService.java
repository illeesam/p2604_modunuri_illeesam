package com.shopjoy.ecadminapi.base.ec.od.service;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhDlivItemChgHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhDlivItemChgHist;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdhDlivItemChgHistRepository;
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
public class OdhDlivItemChgHistService {

    private final OdhDlivItemChgHistRepository odhDlivItemChgHistRepository;

    @PersistenceContext
    private EntityManager em;

    /* 배송 아이템 변경 이력 키조회 */
    public OdhDlivItemChgHistDto.Item getById(String id) {
        // [QueryDSL] 배송 품목 변경 이력 단건 조회
        OdhDlivItemChgHistDto.Item dto = odhDlivItemChgHistRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public OdhDlivItemChgHistDto.Item getByIdOrNull(String id) {
        // [QueryDSL] 배송 품목 변경 이력 단건 조회
        return odhDlivItemChgHistRepository.selectById(id).orElse(null);
    }

    /* 배송 아이템 변경 이력 상세조회 */
    public OdhDlivItemChgHist findById(String id) {
        // [쿼리 메서드] 배송 품목 변경 이력 단건 조회
        return odhDlivItemChgHistRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public OdhDlivItemChgHist findByIdOrNull(String id) {
        // [쿼리 메서드] 배송 품목 변경 이력 단건 조회
        return odhDlivItemChgHistRepository.findById(id).orElse(null);
    }

    /* 배송 아이템 변경 이력 키검증 */
    public boolean existsById(String id) {
        // [쿼리 메서드] 배송 품목 변경 이력 존재 여부 확인
        return odhDlivItemChgHistRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        // [쿼리 메서드] 배송 품목 변경 이력 존재 여부 확인
        if (!odhDlivItemChgHistRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 배송 아이템 변경 이력 목록조회 */
    public List<OdhDlivItemChgHistDto.Item> getList(OdhDlivItemChgHistDto.Request req) {
        // [QueryDSL] 배송 품목 변경 이력 목록 조회
        return odhDlivItemChgHistRepository.selectList(req);
    }

    /* 배송 아이템 변경 이력 페이지조회 */
    public BasePage<OdhDlivItemChgHistDto.Item> getPageData(OdhDlivItemChgHistDto.Request req) {
        PageHelper.addPaging(req);
        // [QueryDSL] 배송 품목 변경 이력 페이지 조회
        return odhDlivItemChgHistRepository.selectPageData(req);
    }

    /* 배송 아이템 변경 이력 등록 */
    @Transactional
    public OdhDlivItemChgHist create(OdhDlivItemChgHist body) {
        body.setDlivItemChgHistId(CmUtil.generateId("odh_dliv_item_chg_hist"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        // [쿼리 메서드] 배송 품목 변경 이력 저장
        OdhDlivItemChgHist saved = odhDlivItemChgHistRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 배송 아이템 변경 이력 수정 */
    @Transactional
    public OdhDlivItemChgHist update(String id, OdhDlivItemChgHist body) {
        CmUtil.requireId(id, "id", this);
        OdhDlivItemChgHist entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "dlivItemChgHistId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // [쿼리 메서드] 배송 품목 변경 이력 저장
        OdhDlivItemChgHist saved = odhDlivItemChgHistRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 배송 아이템 변경 이력 수정 */
    @Transactional
    public OdhDlivItemChgHist updateSelective(OdhDlivItemChgHist entity) {
        if (entity.getDlivItemChgHistId() == null) throw new CmBizException("dlivItemChgHistId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getDlivItemChgHistId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getDlivItemChgHistId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // [QueryDSL] 배송 품목 변경 이력 선택적 필드 수정
        int affected = odhDlivItemChgHistRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();   // clear() 전 필수 — 보류 중인 INSERT/UPDATE 가 clear 로 폐기되는 것 방지
        em.clear();
        return entity;
    }

    /* 배송 아이템 변경 이력 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        OdhDlivItemChgHist entity = findById(id);
        // [쿼리 메서드] 배송 품목 변경 이력 삭제
        odhDlivItemChgHistRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public OdhDlivItemChgHist saveOneBase(OdhDlivItemChgHist entity) {
        String rowStatus  = entity.getRowStatus();
        String authId     = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
        rowStatus = entity.resolveRowStatus(entity.getDlivItemChgHistId());

        if ("D".equals(rowStatus)) {
            if (entity.getDlivItemChgHistId() == null)
                throw new CmBizException("삭제 대상 dlivItemChgHistId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            // [쿼리 메서드] 배송 품목 변경 이력 존재 여부 확인
            if (!odhDlivItemChgHistRepository.existsById(entity.getDlivItemChgHistId()))
                throw new CmBizException("존재하지 않는 OdhDlivItemChgHist입니다: " + entity.getDlivItemChgHistId() + "::" + CmUtil.svcCallerInfo(this));
            // [쿼리 메서드] 배송 품목 변경 이력 ID 기준 삭제
            odhDlivItemChgHistRepository.deleteById(entity.getDlivItemChgHistId());
            return null;
        } else if ("I".equals(rowStatus)) {
            entity.setDlivItemChgHistId(CmUtil.generateId("odh_dliv_item_chg_hist"));
            entity.setRegBy(authId); entity.setRegDate(now);
            entity.setUpdBy(authId); entity.setUpdDate(now);
            // [쿼리 메서드] 배송 품목 변경 이력 저장
            OdhDlivItemChgHist saved = odhDlivItemChgHistRepository.save(entity);
            if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
            return saved;
        } else if ("U".equals(rowStatus)) {
            if (entity.getDlivItemChgHistId() == null)
                throw new CmBizException("수정 대상 dlivItemChgHistId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            entity.setUpdBy(authId);
            // [QueryDSL] 배송 품목 변경 이력 선택적 필드 수정
            int affected = odhDlivItemChgHistRepository.updateSelective(entity);
            if (affected == 0)
                throw new CmBizException("존재하지 않는 OdhDlivItemChgHist입니다: " + entity.getDlivItemChgHistId() + "::" + CmUtil.svcCallerInfo(this));
            em.flush();   // clear() 전 필수 — 보류 중인 INSERT/UPDATE 가 clear 로 폐기되는 것 방지
            em.clear();
            return findById(entity.getDlivItemChgHistId());
        }
        throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));

    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveListBase(List<OdhDlivItemChgHist> rows) {
        /* 0단계: rowStatus 정규화 */
        for (OdhDlivItemChgHist row : rows) {
            String rs = row.getRowStatus();
            if ("M".equals(rs) || rs == null || rs.isBlank()) {
                row.setRowStatus((row.getDlivItemChgHistId() == null || row.getDlivItemChgHistId().isBlank()) ? "I" : "U");
            } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
            }
        }
        CmUtil.requireRowIds(rows, OdhDlivItemChgHist::getDlivItemChgHistId, "U", "dlivItemChgHistId", this);
        CmUtil.requireRowIds(rows, OdhDlivItemChgHist::getDlivItemChgHistId, "D", "dlivItemChgHistId", this);
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()))
            .map(OdhDlivItemChgHist::getDlivItemChgHistId)
            .toList();
        if (!deleteIds.isEmpty()) {
            // [쿼리 메서드] 배송 품목 변경 이력 조건별 삭제
            odhDlivItemChgHistRepository.deleteAllById(deleteIds);
        }

        // 2단계: UPDATE - updateSelective
        List<OdhDlivItemChgHist> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()))
            .toList();
        for (OdhDlivItemChgHist row : updateRows) {
            row.setUpdBy(authId);
            // [QueryDSL] 배송 품목 변경 이력 선택적 필드 수정
            int affected = odhDlivItemChgHistRepository.updateSelective(row);
            if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getDlivItemChgHistId() + "::" + CmUtil.svcCallerInfo(this));
        }

        // 3단계: INSERT
        List<OdhDlivItemChgHist> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (OdhDlivItemChgHist row : insertRows) {
            row.setDlivItemChgHistId(CmUtil.generateId("odh_dliv_item_chg_hist"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            // [쿼리 메서드] 배송 품목 변경 이력 저장
            odhDlivItemChgHistRepository.save(row);
        }

        // 4단계: 영속성 컨텍스트 동기화
        em.flush();
        em.clear();
        return;

    }
}

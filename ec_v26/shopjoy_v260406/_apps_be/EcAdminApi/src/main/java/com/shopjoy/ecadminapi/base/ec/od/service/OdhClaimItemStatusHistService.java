package com.shopjoy.ecadminapi.base.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhClaimItemStatusHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhClaimItemStatusHist;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdhClaimItemStatusHistRepository;
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
public class OdhClaimItemStatusHistService {

    private final OdhClaimItemStatusHistRepository odhClaimItemStatusHistRepository;

    @PersistenceContext
    private EntityManager em;

    /* 클레임 아이템 상태 이력 키조회 */
    public OdhClaimItemStatusHistDto.Item getById(String id) {
        OdhClaimItemStatusHistDto.Item dto = odhClaimItemStatusHistRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public OdhClaimItemStatusHistDto.Item getByIdOrNull(String id) {
        return odhClaimItemStatusHistRepository.selectById(id).orElse(null);
    }

    /* 클레임 아이템 상태 이력 상세조회 */
    public OdhClaimItemStatusHist findById(String id) {
        return odhClaimItemStatusHistRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public OdhClaimItemStatusHist findByIdOrNull(String id) {
        return odhClaimItemStatusHistRepository.findById(id).orElse(null);
    }

    /* 클레임 아이템 상태 이력 키검증 */
    public boolean existsById(String id) {
        return odhClaimItemStatusHistRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!odhClaimItemStatusHistRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 클레임 아이템 상태 이력 목록조회 */
    public List<OdhClaimItemStatusHistDto.Item> getList(OdhClaimItemStatusHistDto.Request req) {
        return odhClaimItemStatusHistRepository.selectList(req);
    }

    /* 클레임 아이템 상태 이력 페이지조회 */
    public OdhClaimItemStatusHistDto.PageResponse getPageData(OdhClaimItemStatusHistDto.Request req) {
        PageHelper.addPaging(req);
        return odhClaimItemStatusHistRepository.selectPageData(req);
    }

    /* 클레임 아이템 상태 이력 등록 */
    @Transactional
    public OdhClaimItemStatusHist create(OdhClaimItemStatusHist body) {
        body.setClaimItemStatusHistId(CmUtil.generateId("odh_claim_item_status_hist"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        OdhClaimItemStatusHist saved = odhClaimItemStatusHistRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 클레임 아이템 상태 이력 수정 */
    @Transactional
    public OdhClaimItemStatusHist update(String id, OdhClaimItemStatusHist body) {
        CmUtil.requireId(id, "id", this);
        OdhClaimItemStatusHist entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "claimItemStatusHistId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdhClaimItemStatusHist saved = odhClaimItemStatusHistRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 클레임 아이템 상태 이력 수정 */
    @Transactional
    public OdhClaimItemStatusHist updateSelective(OdhClaimItemStatusHist entity) {
        if (entity.getClaimItemStatusHistId() == null) throw new CmBizException("claimItemStatusHistId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getClaimItemStatusHistId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getClaimItemStatusHistId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = odhClaimItemStatusHistRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 클레임 아이템 상태 이력 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        OdhClaimItemStatusHist entity = findById(id);
        odhClaimItemStatusHistRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public OdhClaimItemStatusHist saveOneBase(OdhClaimItemStatusHist entity) {
        String rowStatus  = entity.getRowStatus();
        String authId     = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
        if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
            rowStatus = (entity.getClaimItemStatusHistId() == null || entity.getClaimItemStatusHistId().isBlank()) ? "I" : "U";
        }

        if ("D".equals(rowStatus)) {
            if (entity.getClaimItemStatusHistId() == null)
                throw new CmBizException("삭제 대상 claimItemStatusHistId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            if (!odhClaimItemStatusHistRepository.existsById(entity.getClaimItemStatusHistId()))
                throw new CmBizException("존재하지 않는 OdhClaimItemStatusHist입니다: " + entity.getClaimItemStatusHistId() + "::" + CmUtil.svcCallerInfo(this));
            odhClaimItemStatusHistRepository.deleteById(entity.getClaimItemStatusHistId());
            return null;
        } else if ("I".equals(rowStatus)) {
            entity.setClaimItemStatusHistId(CmUtil.generateId("odh_claim_item_status_hist"));
            entity.setRegBy(authId); entity.setRegDate(now);
            entity.setUpdBy(authId); entity.setUpdDate(now);
            OdhClaimItemStatusHist saved = odhClaimItemStatusHistRepository.save(entity);
            if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
            return saved;
        } else if ("U".equals(rowStatus)) {
            if (entity.getClaimItemStatusHistId() == null)
                throw new CmBizException("수정 대상 claimItemStatusHistId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            entity.setUpdBy(authId);
            int affected = odhClaimItemStatusHistRepository.updateSelective(entity);
            if (affected == 0)
                throw new CmBizException("존재하지 않는 OdhClaimItemStatusHist입니다: " + entity.getClaimItemStatusHistId() + "::" + CmUtil.svcCallerInfo(this));
            em.clear();
            return findById(entity.getClaimItemStatusHistId());
        }
        throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));

    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveListBase(List<OdhClaimItemStatusHist> rows) {
        /* 0단계: rowStatus 정규화 */
        for (OdhClaimItemStatusHist row : rows) {
            String rs = row.getRowStatus();
            if ("M".equals(rs) || rs == null || rs.isBlank()) {
                row.setRowStatus((row.getClaimItemStatusHistId() == null || row.getClaimItemStatusHistId().isBlank()) ? "I" : "U");
            } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
            }
        }
        CmUtil.requireRowIds(rows, OdhClaimItemStatusHist::getClaimItemStatusHistId, "U", "claimItemStatusHistId", this);
        CmUtil.requireRowIds(rows, OdhClaimItemStatusHist::getClaimItemStatusHistId, "D", "claimItemStatusHistId", this);
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()))
            .map(OdhClaimItemStatusHist::getClaimItemStatusHistId)
            .toList();
        if (!deleteIds.isEmpty()) {
            odhClaimItemStatusHistRepository.deleteAllById(deleteIds);
        }

        // 2단계: UPDATE - updateSelective
        List<OdhClaimItemStatusHist> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()))
            .toList();
        for (OdhClaimItemStatusHist row : updateRows) {
            row.setUpdBy(authId);
            int affected = odhClaimItemStatusHistRepository.updateSelective(row);
            if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getClaimItemStatusHistId() + "::" + CmUtil.svcCallerInfo(this));
        }

        // 3단계: INSERT
        List<OdhClaimItemStatusHist> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (OdhClaimItemStatusHist row : insertRows) {
            row.setClaimItemStatusHistId(CmUtil.generateId("odh_claim_item_status_hist"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            odhClaimItemStatusHistRepository.save(row);
        }

        // 4단계: 영속성 컨텍스트 동기화
        em.flush();
        em.clear();
        return;

    }
}
